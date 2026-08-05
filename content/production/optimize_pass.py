#!/usr/bin/env python3
"""Wave 5 polish: re-normalize masters, ensure faststart, soft limiter, fade ends."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MASTERS = ROOT / "content" / "production" / "masters"
FIXTURES = ROOT / "database" / "seeders" / "fixtures" / "assembled"
FFMPEG = str(Path.home() / ".local/bin/ffmpeg")
FFPROBE = str(Path.home() / ".local/bin/ffprobe")


def duration(path: Path) -> float:
    out = subprocess.check_output(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        text=True,
    ).strip()
    return float(out)


def polish(src: Path, dest: Path) -> None:
    d = duration(src)
    fade_st = max(0.2, d - 1.1)
    tmp = dest.with_suffix(".tmp.mp4")
    # Two-pass loudnorm-ish: single pass with loudnorm + soft limiter + end fade on audio only
    subprocess.run(
        [
            FFMPEG, "-y", "-i", str(src),
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p",
            "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.92,afade=t=out:st={fade_st:.3f}:d=1.0",
            "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
            "-movflags", "+faststart",
            str(tmp),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    tmp.replace(dest)
    # also copy to fixtures
    FIXTURES.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copy(dest, FIXTURES / dest.name)
    print(f"polished {dest.name} ({duration(dest):.1f}s)")


def main() -> None:
    for src in sorted(MASTERS.glob("ep-*.mp4")):
        polish(src, src)


if __name__ == "__main__":
    main()
