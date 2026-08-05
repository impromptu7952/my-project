# Content inventory snapshot — 2026-08-05

## Research & brand
| Asset | Path |
|-------|------|
| Global research (Ms. Rachel etc.) | `content/bible/research-insights.md` |
| Pedagogy playbook | `content/bible/pedagogy-playbook.md` |
| Character bible | `content/bible/character-bible.md` |
| Songbook S1 | `content/bible/songbook-season1.md` |
| Series map | `content/catalog/series-map.md` |
| Machine catalog | `content/catalog/episodes-catalog.json` |
| Library README | `content/README.md` |

## Characters (canonical Imagine)
| ID | File |
|----|------|
| lumi | `content/assets/characters/lumi-canonical.jpg` |
| pip | `content/assets/characters/pip-canonical.jpg` |
| ari | `content/assets/characters/ari-canonical.jpg` |
| kiki | `content/assets/characters/kiki-canonical.jpg` |
| mimoza | `content/assets/characters/mimoza-canonical.jpg` |
| profiles | `content/characters/profiles.json` |

## Video frames (scene stills)
- lumi-hello-playroom, lumi-colors-balls, lumi-body-parts  
- lumi-kiki-animals, lumi-ari-feelings, mimoza-bedtime  
- lumi-numbers-three, lumi-pip-sing  
- cast thumbnail: cast-lumi-pip-ari  

## Imagine pilot videos (6s shots)
| File | Use |
|------|-----|
| lumi-hello-wave.mp4 | Greetings / special open |
| lumi-colors-present.mp4 | Colors / numbers prop |
| lumi-body-parts.mp4 | Body |
| lumi-ari-breathe.mp4 | Feelings / calm breath |
| lumi-kiki-animals.mp4 | Animals / Kiki |
| mimoza-bedtime.mp4 | Stories / bedtime |

## Curriculum
- **16 topics**
- **45 episode packages** (`content/episodes/{slug}/`)
- Each package: meta, production-spec, script, storyboard, captions.vtt, vo-script
- Premium scripts: colors, first words, animals, feelings, bedtime, numbers, season special

## App integration
- `ContentSeeder` loads catalog → topics/series/episodes  
- **13 published** with fixtures (see `VIDEO_FIXTURES`)  
- Remaining **draft** for Studio production  
- Full-package specs seeded as `*-content-v1` production specs  
