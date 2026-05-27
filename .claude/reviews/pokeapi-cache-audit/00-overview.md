# PokeAPI Cache vs DB Schema Audit — Status Board

Plan: [/.claude/plans/pokeapi-cache-audit.md](../../plans/pokeapi-cache-audit.md)

This file is the resume point if the audit is interrupted. Each batch ticks its box and writes its notes file when complete. The synthesis step (Batch 14) reads every batch file in this directory.

## Preservation contract (do not regress)

- `pokemonSpritesTable` — [database/schemas/pokeapi/pokemon.ts:231-250](../../../database/schemas/pokeapi/pokemon.ts)
- `pokemonSpeciesEvolutionsTable.baseForm` — [database/schemas/pokeapi/pokemon-species.ts:262](../../../database/schemas/pokeapi/pokemon-species.ts)
- `pokemonSpeciesEvolutionsTable.usedMoveId` — [database/schemas/pokeapi/pokemon-species.ts:238](../../../database/schemas/pokeapi/pokemon-species.ts)
- `pokemonSpeciesEvolutionsTable.evolveStartPokemonId` / `evolveEndPokemonId` — [database/schemas/pokeapi/pokemon-species.ts:226](../../../database/schemas/pokeapi/pokemon-species.ts), `:231`
- Any additional custom column flagged by Batches 09–11 (append below as discovered)

## Batches

- [x] 01 — Tiny lookups / reference data → `01-tiny-lookups.md`
- [x] 02 — Stats, characteristics, natures → `02-stats-natures.md`
- [x] 03 — Types → `03-types.md`
- [x] 04 — Abilities → `04-abilities.md`
- [x] 05 — Moves → `05-moves.md`
- [x] 06 — Items, berries, machines → `06-items-berries-machines.md`
- [x] 07 — Contests → `07-contests.md`
- [x] 08 — Regions, locations, pokedex → `08-regions-locations-pokedex.md`
- [x] 09 — Pokemon core (HEAVY) → `09-pokemon-core.md`
- [x] 10 — Pokemon forms → `10-pokemon-forms.md`
- [x] 11 — Pokemon species + evolution (PRESERVATION-HEAVY) → `11-species-evolution.md`
- [x] 12 — Pokemon encounters (orphan check) → `12-pokemon-encounters.md`
- [x] 13 — Schema-design / best-practices review → `13-schema-design.md`
- [x] 14 — Synthesis: AUDIT_RECOMMENDATIONS.md, AUDIT_COVERAGE.md, AUDIT_PROCESS.md, _sample-files.json

## Audit complete

All outputs in this directory:
- [AUDIT_RECOMMENDATIONS.md](AUDIT_RECOMMENDATIONS.md) — prioritized action list (5 sections)
- [AUDIT_COVERAGE.md](AUDIT_COVERAGE.md) — per-endpoint field coverage matrix
- [AUDIT_PROCESS.md](AUDIT_PROCESS.md) — reusable playbook for the next re-run
- [_sample-files.json](_sample-files.json) — curated sample-file map (rationale + filenames)

## Additional preserved columns discovered during audit

(append as batches surface them; format: `tableName.columnName — file:line — reason`)

- `pokemonTable.cryLatest` / `cryLegacy` — [pokemon.ts:37-38](../../../database/schemas/pokeapi/pokemon.ts) — flat columns instead of a `pokemonCriesTable`; intentional for query simplicity. Maps to JSON `cries.{latest, legacy}`.
- `pokemonSpeciesEvolutionsTable.relativePhysicalStats` — [pokemon-species.ts:257](../../../database/schemas/pokeapi/pokemon-species.ts) — standard JSON mapping (`detail.relative_physical_stats`), not a custom addition; documenting for completeness.

(Batch 11 confirmed: no orphan custom columns beyond the 4 already in the preservation contract — `pokemonSpritesTable`, `baseForm`, `usedMoveId`, `evolveStart/EndPokemonId`.)
