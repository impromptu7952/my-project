# PlayZone Kids — Long-term Studio & Platform Roadmap

**Repo:** `github.com/impromptu7952/my-project`  
**Status:** Living plan (2026-08-05)  
**North star:** Professional AI-assisted production studio for Albanian toddler education (ages 1–3), plus a polished co-viewing consumer app.

---

## Product vision

Editors produce original educational episodes the way a kids’ TV production does — **brief → script → voice → visuals → edit → publish** — with Grok (xAI) accelerating each step, full human control, and the ability to jump back, revise, and re-export at any time.

Parents/caregivers get a calm, Albanian-first watch + play experience linked by curriculum.

---

## Production workflow (target)

| Step | Editor does | AI does | Preview |
|------|-------------|---------|---------|
| 1. Brief / curriculum | Topic, goals, age, dialect, length | Learning goals, vocab, structure | Goal cards |
| 2. Script | Edit dialogue, pauses, songs | Full toddler Albanian script | Script reader + timing |
| 3. Voice | Pick voice profile, pace, approve takes | VO script + TTS manifest / cues | Audio player (when TTS wired) |
| 4. Storyboard | Reorder/edit shots | Scene breakdown, shot list | Shot cards |
| 5. Visuals | Approve/reject prompts, pick style | Image/video prompts per shot | Prompt gallery + gen hooks |
| 6. Edit package | Timing, captions, music cues | EDL, VTT, on-screen text | Caption preview + checklist |
| 7. Quality | Override checks, notes | Age/pedagogy/safety review | Report |
| 8. Publish | Upload master, set live | — | Public watch page |

**Non-negotiables**
- Grok via same `XAI_API_KEY` / `api.x.ai` subscription as local tooling
- Per-step **agent profiles** (system prompt, model params, temperature) editable by editors
- **Artifacts versioned**; edit or regenerate always creates a new version
- **Back/forward** navigation between steps without destroying history
- Stub mode when no API key (tests + offline)

---

## Platform phases

### Phase A — Studio core (now → near-term)
- [x] Dashboard-aligned Studio UI (shadcn + light/dark)
- [ ] Agent profiles (CRUD + seed defaults per stage)
- [ ] Step workspace on production runs (nav, status, preview)
- [ ] Manual artifact edit + regenerate single stage
- [ ] Real stage agents calling Grok with profile prompts
- [ ] Script-focused preview (sections, pauses, Albanian)

### Phase B — Media pipeline
- [ ] Pluggable TTS (Albanian-capable provider or human upload)
- [ ] Image/video gen provider interfaces + visual approval
- [ ] Timeline/edit instructions UI
- [ ] Master video attach + caption attach from package

### Phase C — Consumer elevation
- [ ] Rich video library (topics, series, continue watching)
- [ ] Watch page: captions default SQ, co-play tips, linked games
- [ ] Parent dashboard: playlists, favorites, progress polish
- [ ] Offline-friendly progressive media where possible

### Phase D — Scale & quality
- [ ] Multi-role (writer vs approver)
- [ ] Cost/usage dashboards per run
- [ ] Character bible / brand kit for animated Lumi
- [ ] Analytics for parents only (no child tracking)
- [ ] Optional third-party distribution

---

## Technical anchors

| Concern | Approach |
|---------|----------|
| AI | `App\Services\Xai\XaiClient` → `https://api.x.ai/v1`, model `grok-4.5` |
| Jobs | Laravel queue, stage jobs, human gates |
| Data | `production_specs`, `production_runs`, `production_artifacts` + `agent_profiles` |
| Auth | `is_editor` + Gate `manage-content` + `FEATURE_STUDIO` |
| UI | Inertia React + AppLayout + shadcn + theme tokens |

---

## Success metrics

- Editor can produce a revised script + package for Ngjyrat without leaving Studio
- Regenerate voice or visuals without re-running entire pipeline
- Consumer can watch published episode with captions and open linked game
- Full test suite green after every iteration

---

## Iteration log

| Date | Delivery |
|------|----------|
| 2026-08-05 | Platform MVP + pilot videos; Studio UI shell; this roadmap |
| (next) | Agent profiles + step workspace + edit/regenerate + Grok stage agents |
