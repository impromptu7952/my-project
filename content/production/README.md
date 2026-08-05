# PlayZone production pipeline — Albanian TTS masters

## What ships

14 published episodes with **full standard-literary Albanian dialogue**, multi-voice cast, educational pauses, soft beds, retimed video, and captions.

| Episode | Duration | Focus |
|---------|----------|--------|
| ngjyrat-kuq-kalter-verdh-gjelber | ~3:00 | 4 colors + Ku është…? |
| pershendetjet-miremengjesi | ~1:15 | Mirëmëngjesi / wave |
| kafshet-qeni-dhe-macja | ~1:34 | ham / miau |
| trupi-koka-duart-kembe | ~1:33 | body + move |
| fjalet-mama-baba-po-jo | ~1:43 | first words |
| qetesia-fryma | ~1:16 | calm breath |
| ndjenjat-trishtim-dhe-perqafim | ~1:26 | feelings + hug |
| ngjyrat-e-kuqe | ~1:18 | red deep-dive |
| kafshet-miau-me-kiki | ~1:14 | peekaboo miau |
| special-miresevini-ne-playzone | ~1:44 | full cast |
| qetesia-nate-e-mire | ~1:35 | bedtime |
| historite-topi-i-humbyer | ~1:10 | 3-beat story |
| numrat-nje-dy-tre | ~1:33 | count 1–3 |
| levizja-kerce-trokit | ~1:15 | jump/stomp/stop |

Masters: `content/production/masters/ep-*.mp4`  
Fixtures: `database/seeders/fixtures/assembled/ep-*.mp4`

## Voices (Edge neural Albanian)

| Profile | Voice | Rate / pitch | Role |
|---------|-------|--------------|------|
| lumi | sq-AL-AnilaNeural | −22% / +8Hz | Parentese teacher |
| lumi_celebrate | Anila | −10% / +12Hz | Praise |
| lumi_soft | Anila | −28% / +2Hz | Feelings / calm |
| pip | Anila | +12% / +25Hz | Bird peeps |
| ari | sq-AL-IlirNeural | −25% / −8Hz | Soft bear |
| kiki | Anila | +5% / +18Hz | Kitten |
| mimoza | Anila | −30% / −10Hz | Elder storyteller |

## Waves applied

1. **Dialogue packages** — timed educational scripts (`dialogues/all_episodes.json`)
2. **TTS** — Edge neural Albanian line-by-line with cache
3. **VO assembly** — speech + 4.5–6s interactive pauses (Ms. Rachel technique)
4. **Video retime** — motion clip per segment + freeze-hold on pauses
5. **Mix** — VO loudnorm −16 LUFS + soft sine bed + limiter + fades  
6. **Deploy** — seeder fixtures + `public/storage` materialization

## Rebuild

```bash
export PATH="$HOME/.local/bin:$PATH"
# one episode
python3 content/production/build_episodes.py --only ngjyrat-kuq-kalter-verdh-gjelber
# all
python3 content/production/build_episodes.py
# then seed app (main or worktree)
./scripts/seed-and-sync-videos.sh
```

Requires: `ffmpeg`, `ffprobe`, `edge-tts` (`pipx install edge-tts`).

## Further optimization frontiers

Already pushed hard; next gains need new inputs:

| Idea | Why blocked / hard |
|------|--------------------|
| Grok TTS (`api.x.ai/v1/tts`) | No valid `XAI_API_KEY` in this env |
| True musical beds / songs | Generative sine pads only; no licensed toddler music |
| Lip-sync animation | Imagine clips are short loops, not phoneme-driven |
| Clap / SFX library | Could add; low priority vs speech clarity |
| Human Albanian VO | Best quality leap — record over same timelines |
| xAI custom voice clone of “Lumi” | Needs key + consent reference clip |

## App integration

- `App\Services\Tts\EdgeTtsProvider` bound when `TTS_DRIVER=edge`
- Studio voice stage can call the same provider later
