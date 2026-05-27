# 07 — Contests
**Endpoints:** contest-effect (34 — sampled 10), super-contest-effect (23 — sampled 10)
**Schema files touched:** berries-and-contests.ts

## contest-effect

- Files sampled: 1.json, 5.json, 10.json, 15.json, 20.json, 25.json, 30.json, 34.json + mixed
- JSON top-level fields: `id`, `appeal` (int), `jam` (int), `effect_entries` (array of `{effect, language}`), `flavor_text_entries` (array of `{flavor_text, language}`)
- DB tables: `contestEffectsTable` (id, appeal, jam) + `contestEffectEffectEntriesTable` (i18n effect text) + `contestEffectFlavorTextsTable` (i18n flavor text) ([berries-and-contests.ts](../../../database/schemas/pokeapi/berries-and-contests.ts))
- Persisted ↔ JSON: **full coverage** — 1:1 with language-indexed text tables
- **Dropped:** none
- Seed: [seed.ts:832-871](../../../database/seeds/pokeapi/seed.ts) — complete
- Issues: none

## super-contest-effect

- Files sampled: 1.json, 5.json, 10.json, 15.json, 20.json, 23.json + mid
- JSON top-level fields: `id`, `appeal` (int), `flavor_text_entries` (i18n), `moves` (array of move refs — 16–61 moves per effect)
- DB tables: `superContestEffectsTable` + flavor-text join ([berries-and-contests.ts](../../../database/schemas/pokeapi/berries-and-contests.ts))
- Persisted ↔ JSON: appeal, flavor texts — but **`moves[]` array is silently dropped**
- **Dropped JSON fields:**
  - `moves[]` — **arguably useful** (which moves use this super-contest effect). No table captures move ↔ super_contest_effect relation. Reverse link from moves.ts: moves have `super_contest_effect` FK so it's queryable from that side, but a junction would let you list "all moves with Voltage effect" without scanning all moves.
- Seed: [seed.ts:808-830](../../../database/seeds/pokeapi/seed.ts) — moves array unused
- Issues: the moves array is reconstructable via reverse query from `movesTable.superContestEffectId`, so this is borderline reconstructable, not a true loss.

## Preservation-list touches
None.

## Group-level observations

1. **Contest-effect has the `jam` dimension** that super-contest-effect lacks — different contest mechanics (`jam` = disruption points in main contests; super contests use a different system).
2. **`super-contest-effect.moves` is reconstructable** via `movesTable.superContestEffectId` (which Batch 05 confirms is persisted), so this is more of an indexing/convenience question than a data loss.
3. **Contest-effect endpoint is one of the cleanest in the audit** — every JSON field captured.
