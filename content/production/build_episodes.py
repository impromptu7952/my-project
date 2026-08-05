#!/usr/bin/env python3
"""PlayZone multi-wave Albanian TTS + video assembly pipeline.

Waves:
  1. Dialogue packages (JSON input)
  2. Edge TTS per line (voice profiles, parentese rates)
  3. VO assembly with educational pauses + soft music beds
  4. Video retime to audio + mix + loudnorm + VTT
  5. Optimize: ducking, fades, micro-crossfade holds

Usage:
  python3 content/production/build_episodes.py [--only slug] [--wave 2]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROD = ROOT / "content" / "production"
DIALOGUES = PROD / "dialogues" / "all_episodes.json"
AUDIO = PROD / "audio"
MASTERS = PROD / "masters"
BEDS = PROD / "beds"
WORK = PROD / "work"
FRAMES = ROOT / "content" / "assets" / "video-frames"
VIDEOS = ROOT / "content" / "assets" / "videos"
FIXTURES = ROOT / "database" / "seeders" / "fixtures" / "assembled"
EPISODES_CONTENT = ROOT / "content" / "episodes"

FFMPEG = os.environ.get("FFMPEG", str(Path.home() / ".local/bin/ffmpeg"))
FFPROBE = os.environ.get("FFPROBE", str(Path.home() / ".local/bin/ffprobe"))
EDGE = shutil.which("edge-tts") or str(Path.home() / ".local/bin/edge-tts")

VISUAL_CLIP = {
    "hello": VIDEOS / "lumi-hello-wave.mp4",
    "colors": VIDEOS / "lumi-colors-present.mp4",
    "body": VIDEOS / "lumi-body-parts.mp4",
    "breathe": VIDEOS / "lumi-ari-breathe.mp4",
    "kiki": VIDEOS / "lumi-kiki-animals.mp4",
    "mimoza": VIDEOS / "mimoza-bedtime.mp4",
    "numbers": VIDEOS / "lumi-numbers-three.mp4",
    "sing": VIDEOS / "lumi-pip-sing.mp4",
}


def run(cmd: list[str], check: bool = True, quiet: bool = True) -> subprocess.CompletedProcess:
    kwargs = {"text": True}
    if quiet:
        kwargs["stdout"] = subprocess.DEVNULL
        kwargs["stderr"] = subprocess.DEVNULL
    return subprocess.run(cmd, check=check, **kwargs)


def duration(path: Path) -> float:
    out = subprocess.check_output(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        text=True,
    ).strip()
    return float(out) if out else 0.0


def ensure_dirs() -> None:
    for d in (AUDIO, MASTERS, BEDS, WORK):
        d.mkdir(parents=True, exist_ok=True)


def make_silence(path: Path, seconds: float) -> None:
    seconds = max(0.15, float(seconds))
    run([
        FFMPEG, "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
        "-t", f"{seconds:.3f}",
        "-c:a", "pcm_s16le", str(path),
    ])


def tts_line(text: str, profile: dict, out: Path) -> None:
    """Generate one line of Albanian TTS with caching by hash."""
    key = hashlib.sha1(
        f"{profile['voice']}|{profile.get('rate','')}|{profile.get('pitch','')}|{profile.get('volume','')}|{text}".encode()
    ).hexdigest()[:16]
    cache = WORK / "tts_cache" / f"{key}.mp3"
    cache.parent.mkdir(parents=True, exist_ok=True)
    if cache.exists() and cache.stat().st_size > 500:
        shutil.copy(cache, out)
        return
    cmd = [
        EDGE,
        "--voice", profile["voice"],
        "--rate", profile.get("rate", "+0%"),
        "--pitch", profile.get("pitch", "+0Hz"),
        "--volume", profile.get("volume", "+0%"),
        "--text", text,
        "--write-media", str(cache),
    ]
    # edge-tts can be flaky; retry twice
    last_err = None
    for _ in range(3):
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            if cache.exists() and cache.stat().st_size > 500:
                shutil.copy(cache, out)
                return
        except subprocess.CalledProcessError as e:
            last_err = e
    raise RuntimeError(f"TTS failed for: {text!r} ({last_err})")


def mp3_to_wav(mp3: Path, wav: Path) -> None:
    run([
        FFMPEG, "-y", "-i", str(mp3),
        "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", str(wav),
    ])


def concat_wavs(parts: list[Path], out: Path) -> None:
    """Concat PCM wavs via filter (safe for silence + speech)."""
    if not parts:
        raise ValueError("no parts")
    if len(parts) == 1:
        shutil.copy(parts[0], out)
        return
    # Use concat demuxer after ensuring identical format
    lst = out.with_suffix(".txt")
    with lst.open("w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    run([
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    lst.unlink(missing_ok=True)


def make_music_bed(path: Path, seconds: float, style: str) -> None:
    """Soft generative bed — pleasant, low volume, toddler-safe (no harsh peaks)."""
    seconds = max(5.0, seconds + 1.0)
    # Generate three gentle sines as separate lavfi inputs (more reliable than filter-only).
    if style == "lullaby":
        freqs = (196.0, 246.94, 293.66)
        vol = 0.04
        lp = 900
    elif style == "calm_pad":
        freqs = (220.0, 277.18, 329.63)
        vol = 0.035
        lp = 800
    elif style == "warm_soft":
        freqs = (329.63, 392.0, 493.88)
        vol = 0.04
        lp = 1100
    elif style == "morning_soft":
        freqs = (349.23, 440.0, 523.25)
        vol = 0.04
        lp = 1200
    else:  # playful_soft
        freqs = (392.0, 523.25, 659.25)
        vol = 0.045
        lp = 1200

    fade_out_st = max(0.5, seconds - 2.8)
    filt = (
        f"[0]volume={vol}[a];[1]volume={vol}[b];[2]volume={vol}[c];"
        f"[a][b][c]amix=inputs=3:duration=longest:normalize=0,"
        f"lowpass=f={lp},highpass=f=100,"
        f"afade=t=in:st=0:d=1.8,"
        f"afade=t=out:st={fade_out_st:.3f}:d=2.5"
    )
    run([
        FFMPEG, "-y",
        "-f", "lavfi", "-i", f"sine=frequency={freqs[0]}:sample_rate=44100:duration={seconds}",
        "-f", "lavfi", "-i", f"sine=frequency={freqs[1]}:sample_rate=44100:duration={seconds}",
        "-f", "lavfi", "-i", f"sine=frequency={freqs[2]}:sample_rate=44100:duration={seconds}",
        "-filter_complex", filt,
        "-t", f"{seconds:.3f}",
        "-ac", "2",
        "-c:a", "pcm_s16le", str(path),
    ])


def mix_vo_and_bed(vo: Path, bed: Path, out: Path) -> None:
    """Mix dialogue over soft bed; VO primary, bed quiet underneath."""
    d = duration(vo)
    fade_out_st = max(0.2, d - 1.4)
    # Normalize VO first to target loudness, then blend a quiet bed (no early fade-out).
    tmp_vo = out.with_name(out.stem + "_vonorm.wav")
    run([
        FFMPEG, "-y", "-i", str(vo),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:a", "pcm_s16le", str(tmp_vo),
    ])
    # Bed at roughly -20 dB relative; sidechain ducking via volume envelope approximation:
    # keep bed continuous but very soft so speech always wins.
    run([
        FFMPEG, "-y",
        "-i", str(tmp_vo),
        "-i", str(bed),
        "-filter_complex",
        f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=1.0[vo];"
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.12,apad=whole_dur={d:.3f}[bed];"
        f"[vo][bed]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
        f"alimiter=limit=0.95,"
        f"afade=t=in:st=0:d=0.35,"
        f"afade=t=out:st={fade_out_st:.3f}:d=1.3",
        "-c:a", "pcm_s16le", str(out),
    ])
    tmp_vo.unlink(missing_ok=True)
    # Safety: if mix somehow silent, fall back to VO-only loudnorm
    try:
        probe = subprocess.check_output(
            [FFMPEG, "-i", str(out), "-af", "volumedetect", "-f", "null", "-"],
            stderr=subprocess.STDOUT, text=True,
        )
        if "mean_volume: -91" in probe or "mean_volume: -inf" in probe:
            raise RuntimeError("silent mix")
    except Exception:
        run([
            FFMPEG, "-y", "-i", str(vo),
            "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.3,afade=t=out:st={fade_out_st:.3f}:d=1.3",
            "-c:a", "pcm_s16le", str(out),
        ])


def normalize_video_clip(src: Path, out: Path) -> None:
    run([
        FFMPEG, "-y", "-i", str(src),
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p",
        "-an",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        str(out),
    ])


def hold_last_frame(src: Path, out: Path, hold: float) -> None:
    """Append freeze of last frame for hold seconds."""
    if hold < 0.05:
        shutil.copy(src, out)
        return
    # tpad stop clone
    run([
        FFMPEG, "-y", "-i", str(src),
        "-vf", f"tpad=stop_mode=clone:stop_duration={hold:.3f}",
        "-an",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        str(out),
    ])


def build_video_for_timeline(segments: list[dict], timings: list[dict], work: Path, out: Path) -> None:
    """Build video matching timed segments: motion clip + hold for pause."""
    pieces: list[Path] = []
    norm_cache: dict[str, Path] = {}

    for i, (seg, timing) in enumerate(zip(segments, timings)):
        visual = seg.get("visual", "hello")
        src = VISUAL_CLIP.get(visual, VISUAL_CLIP["hello"])
        if not src.exists():
            src = next(VIDEOS.glob("*.mp4"))
        if visual not in norm_cache:
            npath = work / f"norm_{visual}.mp4"
            normalize_video_clip(src, npath)
            norm_cache[visual] = npath
        base = norm_cache[visual]
        speech_d = timing["speech"]
        pause_d = timing["pause"]
        total = speech_d + pause_d

        # Loop or trim motion to cover speech, then hold for pause
        clip = work / f"seg_{i:03d}.mp4"
        base_d = duration(base)
        if speech_d <= base_d + 0.05:
            # trim
            run([
                FFMPEG, "-y", "-i", str(base),
                "-t", f"{max(0.3, speech_d):.3f}",
                "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                str(work / f"seg_{i:03d}_motion.mp4"),
            ])
            motion = work / f"seg_{i:03d}_motion.mp4"
        else:
            # loop motion to cover speech
            loops = int(speech_d / base_d) + 2
            lst = work / f"seg_{i:03d}_loop.txt"
            with lst.open("w") as f:
                for _ in range(loops):
                    f.write(f"file '{base}'\n")
            looped = work / f"seg_{i:03d}_looped.mp4"
            run([
                FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                "-c", "copy", str(looped),
            ])
            run([
                FFMPEG, "-y", "-i", str(looped),
                "-t", f"{speech_d:.3f}",
                "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                str(work / f"seg_{i:03d}_motion.mp4"),
            ])
            motion = work / f"seg_{i:03d}_motion.mp4"

        if pause_d > 0.05:
            # gentle freeze during educational pause (Ms Rachel style hold)
            hold_last_frame(motion, clip, pause_d)
        else:
            shutil.copy(motion, clip)
        pieces.append(clip)

    # Concat all pieces
    lst = work / "video_concat.txt"
    with lst.open("w") as f:
        for p in pieces:
            f.write(f"file '{p}'\n")
    run([
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])


def write_vtt(timings: list[dict], segments: list[dict], path: Path) -> None:
    lines = ["WEBVTT", ""]
    for seg, t in zip(segments, timings):
        start = t["start"]
        end = t["start"] + t["speech"]
        text = seg["text"]

        def ts(s: float) -> str:
            h = int(s // 3600)
            m = int((s % 3600) // 60)
            sec = s % 60
            return f"{h:02d}:{m:02d}:{sec:06.3f}"

        lines.append(f"{ts(start)} --> {ts(end)}")
        lines.append(text)
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def mux(video: Path, audio: Path, out: Path) -> None:
    vd = duration(video)
    ad = duration(audio)
    # pad shorter side
    if abs(vd - ad) > 0.15:
        if vd < ad:
            # freeze pad video
            hold = ad - vd
            padded = video.with_name(video.stem + "_pad.mp4")
            hold_last_frame(video, padded, hold)
            video = padded
        else:
            # pad audio
            padded = audio.with_name(audio.stem + "_pad.wav")
            run([
                FFMPEG, "-y", "-i", str(audio),
                "-af", f"apad=pad_dur={vd - ad:.3f}",
                "-c:a", "pcm_s16le", str(padded),
            ])
            audio = padded
    run([
        FFMPEG, "-y",
        "-i", str(video),
        "-i", str(audio),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
        "-shortest",
        "-movflags", "+faststart",
        str(out),
    ])


def build_episode(slug: str, ep: dict, profiles: dict, wave: int = 5) -> Path:
    print(f"\n=== Building {slug} ===")
    work = WORK / slug
    work.mkdir(parents=True, exist_ok=True)
    segments = ep["segments"]
    audio_dir = AUDIO / slug
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Wave 2: TTS each line
    wav_parts: list[Path] = []
    timings: list[dict] = []
    t_cursor = 0.0

    for i, seg in enumerate(segments):
        speaker = seg["speaker"]
        profile = profiles[speaker]
        text = seg["text"]
        pause = float(seg.get("pause_after", 1.0))
        # Slightly longer pause on interactive
        if seg.get("interactive"):
            pause = max(pause, 4.5)

        mp3 = audio_dir / f"{i:03d}_{speaker}.mp3"
        wav = audio_dir / f"{i:03d}_{speaker}.wav"
        sil = audio_dir / f"{i:03d}_silence.wav"

        print(f"  TTS [{speaker}] {text[:50]}…")
        tts_line(text, profile, mp3)
        mp3_to_wav(mp3, wav)
        speech_d = duration(wav)
        make_silence(sil, pause)
        pause_d = duration(sil)

        timings.append({
            "start": t_cursor,
            "speech": speech_d,
            "pause": pause_d,
            "text": text,
            "speaker": speaker,
        })
        t_cursor += speech_d + pause_d
        wav_parts.append(wav)
        wav_parts.append(sil)

    if wave < 3:
        return audio_dir

    # Wave 3: concat VO
    vo = audio_dir / "vo_master.wav"
    print("  Assembling VO…")
    concat_wavs(wav_parts, vo)
    vo_d = duration(vo)
    print(f"  VO duration: {vo_d:.1f}s")

    bed = BEDS / f"{ep.get('music', 'playful_soft')}_{int(vo_d)}.wav"
    if not bed.exists() or abs(duration(bed) - vo_d) > 2:
        print("  Generating music bed…")
        make_music_bed(bed, vo_d, ep.get("music", "playful_soft"))

    mixed = audio_dir / "mix_master.wav"
    print("  Mixing VO + bed…")
    mix_vo_and_bed(vo, bed, mixed)

    # Final loudnorm pass
    final_audio = audio_dir / "final_audio.wav"
    run([
        FFMPEG, "-y", "-i", str(mixed),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.95",
        "-c:a", "pcm_s16le", str(final_audio),
    ])

    if wave < 4:
        return final_audio

    # Wave 4: video timeline
    video_path = work / "timeline.mp4"
    print("  Building video timeline…")
    build_video_for_timeline(segments, timings, work, video_path)

    master = MASTERS / f"ep-{slug}.mp4"
    print("  Muxing…")
    mux(video_path, final_audio, master)

    # Captions
    vtt_path = EPISODES_CONTENT / slug / "captions.vtt"
    vtt_path.parent.mkdir(parents=True, exist_ok=True)
    write_vtt(timings, segments, vtt_path)
    # Also save production copy
    write_vtt(timings, segments, audio_dir / "captions.vtt")

    # Timeline JSON for future edits
    (audio_dir / "timeline.json").write_text(
        json.dumps({"slug": slug, "duration": duration(master), "timings": timings}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Copy to fixtures assembled
    FIXTURES.mkdir(parents=True, exist_ok=True)
    dest = FIXTURES / f"ep-{slug}.mp4"
    shutil.copy(master, dest)
    print(f"  MASTER {master} ({duration(master):.1f}s) -> {dest}")
    return master


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--wave", type=int, default=5)
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    ensure_dirs()
    data = json.loads(DIALOGUES.read_text(encoding="utf-8"))
    profiles = data["voice_profiles"]
    episodes = data["episodes"]

    if args.list:
        for slug in episodes:
            print(slug)
        return 0

    # Verify tools
    for tool in (FFMPEG, FFPROBE, EDGE):
        if not Path(tool).exists() and not shutil.which(tool):
            print(f"Missing tool: {tool}", file=sys.stderr)
            return 1

    targets = args.only or list(episodes.keys())
    ok = 0
    failed = []
    for slug in targets:
        if slug not in episodes:
            print(f"Unknown slug: {slug}")
            failed.append(slug)
            continue
        try:
            build_episode(slug, episodes[slug], profiles, wave=args.wave)
            ok += 1
        except Exception as e:
            print(f"FAILED {slug}: {e}", file=sys.stderr)
            failed.append(slug)

    print(f"\nDone: {ok}/{len(targets)} ok; failed={failed}")
    return 0 if not failed else 2


if __name__ == "__main__":
    raise SystemExit(main())
