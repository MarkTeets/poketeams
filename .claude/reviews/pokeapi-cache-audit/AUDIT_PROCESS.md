# PokeAPI Audit Playbook — How to re-run this audit

This is the self-contained playbook for re-running the PokeAPI cache vs DB schema audit. First run was 2026-05-27; see [AUDIT_COVERAGE.md](AUDIT_COVERAGE.md) and [AUDIT_RECOMMENDATIONS.md](AUDIT_RECOMMENDATIONS.md) for the prior baseline.

## Goal

Compare every JSON field cached under [server-cache/pokeapi.co/api/v2/](../../../server-cache/pokeapi.co/api/v2/) against the Drizzle schema in [database/schemas/pokeapi/](../../../database/schemas/pokeapi/) and the seed at [database/seeds/pokeapi/seed.ts](../../../database/seeds/pokeapi/seed.ts). Produce: (a) a coverage matrix, (b) a prioritized recommendations checklist, (c) a list of custom additions that must not be removed. **No code changes during the audit pass** — the output is documentation only.

## When to re-run

- After a major PokeAPI version bump (new endpoints, new fields)
- After adding a new top-level table to the `pokeapi` schema
- If seed coverage warnings appear in logs
- Periodically (annually?) to catch silent drift

A re-run with no changes should produce an identical [AUDIT_COVERAGE.md](AUDIT_COVERAGE.md) — diff against the prior version.

## Lessons learned from the first run

1. **Use `general-purpose` subagents, not `Explore`.** Explore is read-only; it can describe findings but cannot write to `.claude/reviews/...`. Wasted ~4 batch dispatches on the first run before switching.
2. **Subagent session limits are real.** Three batches hit per-agent token caps after ~5 minutes of work, returning nothing. Plan for retries; or do the heaviest batches inline in the main thread.
3. **Pokemon JSON files are 100–500 KB each.** Read with `limit`/`offset`, not whole-file. Focus on top-level keys + one example of each nested array.
4. **The schema is largely correct.** Most "gaps" are intentional reverse-link drops. The one real critical gap was wild encounters (zero consumption of pokemon-location-area).
5. **Sequential dispatch claimed by plan was unnecessary.** Batches are independent; parallel dispatch works (modulo the read/write tool confusion above).

## Preservation contract (kept in sync with schema)

These columns/tables exist for application-specific reasons and must not be removed by any "cleanup" recommendation:

- `pokemonSpritesTable` ([pokemon.ts:231-250](../../../database/schemas/pokeapi/pokemon.ts))
- `pokemonTable.cryLatest` / `cryLegacy` ([pokemon.ts:37-38](../../../database/schemas/pokeapi/pokemon.ts))
- `pokemonSpeciesEvolutionsTable.baseForm` ([pokemon-species.ts:262](../../../database/schemas/pokeapi/pokemon-species.ts))
- `pokemonSpeciesEvolutionsTable.usedMoveId` ([pokemon-species.ts:238](../../../database/schemas/pokeapi/pokemon-species.ts))
- `pokemonSpeciesEvolutionsTable.evolveStartPokemonId`, `evolveEndPokemonId` ([pokemon-species.ts:226](../../../database/schemas/pokeapi/pokemon-species.ts), `:231`)

If columns are added to `pokemon.ts` or `pokemon-species.ts` that don't have a clean JSON source, append them here.

## Endpoint groups (the 13 batches)

| # | Batch | Endpoints | Schema files |
|---|---|---|---|
| 01 | Tiny lookups | language, generation, version, version-group, gender, growth-rate, pokemon-color/shape/habitat, egg-group, evolution-trigger, move-damage-class/battle-style/category/learn-method/ailment/target, item-pocket/attribute/fling-effect, pal-park-area, pokeathlon-stat, contest-type, berry-firmness/flavor, encounter-condition/-value/method | languages, generations, pokemon-attributes, regions (partial), encounters, move-basics, items (partial), berries-and-contests (partial), stats (partial) |
| 02 | Stats/natures | stat, characteristic, nature | stats, natures |
| 03 | Types | type | types |
| 04 | Abilities | ability | abilities |
| 05 | Moves | move | moves |
| 06 | Items/berries/machines | item, item-category, berry, machine | items, berries-and-contests, machines |
| 07 | Contests | contest-effect, super-contest-effect | berries-and-contests |
| 08 | Regions/locations/pokedex | region, location, location-area, pokedex | regions, pokedex |
| 09 | Pokemon core (HEAVY) | pokemon | pokemon |
| 10 | Pokemon forms | pokemon-form | pokemon-forms |
| 11 | Species + evolution (PRESERVATION-HEAVY) | pokemon-species, evolution-chain | pokemon-species |
| 12 | Pokemon encounters (orphan) | pokemon-location-area | encounters (currently no table) |
| 13 | Schema design (no JSON) | — | all 18 schema files + seed.ts + models |

Plus **Batch 14 — Synthesis** done by main thread reading the 13 batch notes.

## Universal batch instructions (verbatim, paste into every subagent)

```
1. File selection: read __list.json first, then pick up to 10 individual files
   that exercise as many distinct shapes as possible. Prefer variety over
   sequential IDs. For endpoints with ≤10 files, read all of them.

2. For each endpoint, produce:
   - Top-level field inventory (every JSON key seen, with example value or shape)
   - Mapping to the corresponding Drizzle table(s) — column-by-column
   - JSON fields NOT currently persisted (assess: clearly useful / arguably useful / safe to skip)
   - DB columns NOT present in JSON (custom additions — preserve)
   - How seed.ts handles this endpoint (line refs)

3. Recheck the preservation list:
   - pokemonSpritesTable (pokemon.ts:231-250)
   - pokemonSpeciesEvolutionsTable extras: baseForm, usedMoveId, evolveStart/EndPokemonId
   - Any field in pokemon-species.ts or pokemon.ts that lacks a clean 1:1 JSON mapping — flag

4. Write findings to .claude/reviews/pokeapi-cache-audit/NN-<group>.md using
   the standard notes template (see below). Tick the box in 00-overview.md.

5. Return ≤200 words: (a) surprising gaps, (b) preservation-list touches, (c) output file path.
```

## Notes template

```markdown
# NN — <Group name>
**Endpoints:** <list>  **Schema files touched:** <list>

## <endpoint-name>
- Files sampled: <list of filenames>
- JSON top-level fields: <field — short shape — example>
- DB table: <tableName> ([schema-file.ts:line](path))
- Persisted columns ↔ JSON fields: <mapping or "1:1 with notes">
- **Dropped JSON fields:** <field — assessment>
- **DB columns without JSON source (custom — preserve):** <list>
- Seed handling: <seed.ts:line ref + brief note>
- Issues / questions:

(repeat per endpoint)

## Preservation-list touches
(none, or specific)

## Group-level observations
(cross-endpoint patterns, naming inconsistencies, etc.)
```

## File-selection heuristic (variety over sequential)

For each endpoint, pick samples that span the dimensions of variation. Pre-curated samples from the first run are in [_sample-files.json](_sample-files.json). For a fresh re-run, either reuse those (for apples-to-apples diff) or pick different ones (to discover new shapes).

General guidance:
- **Pokemon-related:** include a baseline (bulbasaur), a multi-form (pikachu/deoxys), a special (ditto), a legendary (mewtwo), a regional variant (10000-range), a mega/gmax/totem form (10100+), a DLC-era pokemon (890+), **and at least two `past_types` exemplars: jigglypuff/39 (Normal → Normal/Fairy in Gen 6) and magnemite/81 (Electric → Electric/Steel in Gen 2)**. The past_types/past_abilities/past_stats audit is meaningless if no sample pokemon actually carry historical override data.
- **Items:** poke-balls, evolution stones, key items, machines, berries-as-items — at least one of each.
- **Moves:** physical/special/status mix; include at least one z-move/max-move/gmax, one with rich `meta.stat_changes`, one with `past_values`.
- **Evolution chains:** eevee (multi-branch), trade evolution, item evolution, happiness/affection, level-with-move, regional-variant chain.
- **Location-area:** mix routes, caves, cities, special areas, DLC locations.

## Synthesis step

After all 13 batches complete, the main thread reads every `NN-*.md` file and produces:
- `AUDIT_RECOMMENDATIONS.md` (5 sections: Preservation contract, Schema additions, Schema fixes, Seed updates, Out of scope)
- `AUDIT_COVERAGE.md` (per-endpoint coverage matrix)
- `_sample-files.json` (rationale + sample list per endpoint)
- Update `00-overview.md` to mark Batch 14 complete

## Verification of the audit

1. `AUDIT_RECOMMENDATIONS.md` Section A enumerates every item in the Preservation contract above.
2. `AUDIT_COVERAGE.md` has a row for every endpoint in [resources.json](../../../server-cache/pokeapi.co/api/v2/resources.json) plus `pokemon-location-area`.
3. Spot-check 2–3 batch notes against the actual JSON to confirm no obvious top-level field was missed.
4. A follow-up "execute the recommendations" session can `cat AUDIT_RECOMMENDATIONS.md` and proceed without re-deriving findings.
5. A future re-run can `cat AUDIT_PROCESS.md` (this file) and proceed without re-deriving the batch grouping.

## Pointers

- **Cache:** [server-cache/pokeapi.co/api/v2/](../../../server-cache/pokeapi.co/api/v2/), endpoint list in [resources.json](../../../server-cache/pokeapi.co/api/v2/resources.json) (note: `pokemon-location-area` is NOT in resources.json but exists as 1350 files)
- **Schema:** [database/schemas/pokeapi/](../../../database/schemas/pokeapi/) (18 files)
- **Seed:** [database/seeds/pokeapi/seed.ts](../../../database/seeds/pokeapi/seed.ts) (~2587 lines)
- **Models (query patterns):** [app/models/pokeapi.server.ts](../../../app/models/pokeapi.server.ts)
- **Timestamps helper:** [database/utils/columnHelpers.ts](../../../database/utils/columnHelpers.ts)
