# PlayZone Kids — Content Library

Albanian-first educational content for **ages 1–3** (co-viewing).  
This tree is the **editorial source of truth** for characters, curriculum, scripts, and Imagine assets. The Laravel `ContentSeeder` loads catalog metadata into the app.

---

## Layout

```
content/
  bible/                 Research + pedagogy + character bible
  catalog/               Series map + episodes-catalog.json
  characters/            Profiles + per-character folders
  assets/
    characters/          Canonical Imagine stills
    video-frames/        Keyframe stills for episodes
    thumbnails/          Brand / cast key art
    videos/              Imagine short pilots (mp4)
  episodes/{slug}/       Production package per episode
    meta.json
    production-spec.json
    script.md
    storyboard.json
    captions.vtt
    vo-script.json
```

---

## Cast (Season 1)

| Character | Role | Art |
|-----------|------|-----|
| **Lumi** | Lead teacher (Ms. Rachel–style pedagogy, animated) | `assets/characters/lumi-canonical.jpg` |
| **Pip** | Yellow bird sidekick | `assets/characters/pip-canonical.jpg` |
| **Ari** | Soft bear — feelings & calm | `assets/characters/ari-canonical.jpg` |
| **Kiki** | Kitten — animals & peekaboo | `assets/characters/kiki-canonical.jpg` |
| **Nëna Mimoza** | Elder storyteller / bedtime | `assets/characters/mimoza-canonical.jpg` |

See `bible/character-bible.md` and `characters/profiles.json`.

---

## Catalog scale (current)

- **16 topics** (greetings → calm)
- **45 episode briefs** in `catalog/episodes-catalog.json`
- **Full production packages** for every episode under `episodes/`
- **Premium hand-written scripts** for flagship eps (colors, first words, animals, feelings, bedtime)
- **10 published pilots** wired with video fixtures in `database/seeders/fixtures/`
- Remaining episodes seed as **draft** ready for Studio pipeline

---

## Pedagogy (non-negotiables)

Documented in `bible/research-insights.md` and `bible/pedagogy-playbook.md`:

1. Parentese + slow clear Albanian (standard literary)
2. 4–7s pauses after interactive prompts
3. Gestures with words
4. ≤ 6 new words per episode
5. Hello / goodbye rituals
6. Low stimulation vs “brainrot” nursery factories
7. Always a co-play tip for grown-ups

---

## Imagine production workflow

1. Canonical character still (once)  
2. Scene stills via `image_edit` from canon  
3. `image_to_video` per shot (6s preferred)  
4. Copy masters into `assets/videos/` + `database/seeders/fixtures/`  
5. Attach via `ContentSeeder::VIDEO_FIXTURES`  
6. Captions from package `captions.vtt`

**Note:** Video gen may rate-limit; stills and scripts remain shippable without full masters.

---

## Seeding into the app

```bash
php artisan db:seed --class=ContentSeeder
```

Published fixtures map (see seeder):

| Episode slug | Fixture |
|--------------|---------|
| ngjyrat-kuq-kalter-verdh-gjelber | lumi-colors-present.mp4 |
| pershendetjet-miremengjesi | lumi-hello-wave.mp4 |
| trupi-koka-duart-kembe | lumi-body-parts.mp4 |
| qetesia-fryma / ndjenjat-… | lumi-ari-breathe.mp4 |
| … | pilot-animals / pilot-greetings |

---

## Parallel with Studio feature work

Other sessions may change production pipeline UI/agents. This content folder is intentionally **decoupled**:

- Specs match `storage/schemas/production_spec.v1.json`
- Scripts are human-editable Markdown
- Seeder only **reads** catalog + fixtures; it does not depend on live AI jobs

When Studio gains TTS/image providers, point agent profiles at the same character bible paths.
