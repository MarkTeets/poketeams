# 08 — Regions, locations, pokedex
**Endpoints:** region (12 — all read), location (1097 — sampled 10), location-area (1245 — sampled 10), pokedex (36 — sampled 10)
**Schema files touched:** regions.ts, pokedex.ts

## region

- Files sampled: all 12 (1.json–11.json plus high-id paldea)
- JSON top-level fields:
  - `id`, `name`, `names` (i18n)
  - `locations` (array of refs)
  - `main_generation` (`{name, url}`)
  - `pokedexes` (array of refs)
  - `version_groups` (array of refs)
- DB tables: `regionsTable`, `regionNamesTable` ([regions.ts:14-40](../../../database/schemas/pokeapi/regions.ts))
- Persisted ↔ JSON: 1:1 for regionId, name; synthesized URL; i18n via region_names
- **Dropped JSON fields:**
  - `locations` — **reconstructable** (locations FK back to region)
  - `main_generation` — **arguably useful** (primary gen for region; would be a single nullable FK column on regionsTable)
  - `pokedexes` — **reconstructable** (pokedex FK back to region)
  - `version_groups` — **arguably useful** (which version groups belong to region; would be a junction table)
- Seed handling: [seed.ts:935-956](../../../database/seeds/pokeapi/seed.ts) — simple direct mapping, no custom logic
- Issues / questions: `main_generation` is a cheap nullable FK addition. `version_groups` requires a junction table.

## location

- Files sampled: canalave-city/1, blackthorn-city/65, kanto-route-1/88, seafoam-islands/136, cerulean-cave/147, icefall-cave/502, two-island/805, kanto-pokemart/1090, kanto-underground-path/1113, location/1000
- JSON top-level fields: `id`, `name`, `region` (`{name,url}|null`), `names` (i18n), `game_indices` (per-version IDs), `areas` (refs to location-area)
- DB tables: `locationsTable`, `locationNamesTable` ([regions.ts:99-126](../../../database/schemas/pokeapi/regions.ts))
- Persisted ↔ JSON: locationId, name, regionId (nullable, extracted from URL), synthesized URL, i18n
- **Dropped JSON fields:**
  - `game_indices` (per-version location IDs) — **arguably useful** for version-specific location lookups; would need a `locationGameIndicesTable`
  - `areas` — **reconstructable** (location-area FK back to location)
- Seed handling: [seed.ts:1376-1404](../../../database/seeds/pokeapi/seed.ts) — game_indices not consumed
- Issues: game_indices is a recurring pattern (versions, pokemon, types all have it) — could use a unified approach.

## location-area

- Files sampled: 1.json, 50.json, 100.json, 200.json, 400.json, 500.json, 800.json, 1000.json, 1200.json, 1245.json
- JSON top-level fields: `id`, `name`, `game_index`, `location` (ref), `names` (i18n), `encounter_method_rates` (per-method per-version % chance), `pokemon_encounters` (pokemon × version × method × condition_values × min/max level)
- DB tables: `locationAreasTable`, `locationAreaNamesTable` ([regions.ts:128-158](../../../database/schemas/pokeapi/regions.ts))
- Persisted ↔ JSON: locationAreaId, name, gameIndex, locationId, synthesized URL, i18n
- **Dropped JSON fields:**
  - **`encounter_method_rates`** — **CRITICAL DROP** — defines encounter % per method per version (e.g., old-rod 25% in Diamond/Pearl)
  - **`pokemon_encounters`** — **CRITICAL DROP** — the richest structure in the endpoint: pokemon × version × method × condition_values × min/max level. Completely unpersisted.
- Seed handling: [seed.ts:1739-1765](../../../database/seeds/pokeapi/seed.ts) — only location-area metadata seeded; NO tables for encounter rates or pokemon encounters.
- Issues: **MAJOR GAP.** This is the canonical "where can I find pokemon X" data and there's no table for it. Either (1) intentionally not in scope (the app doesn't need wild encounters), (2) deferred to a future feature, or (3) an oversight. Batch 12 will check the orphan `pokemon-location-area` endpoint which holds a similar structure.

## pokedex

- Files sampled: national/1, kanto/2, original-johto/3, hoenn/4, sinnoh/7, unova/11, updated-unova/12, kalos/14, letsgo-kanto/26, paldea/35
- JSON top-level fields: `id`, `name`, `is_main_series`, `region` (nullable), `descriptions` (i18n), `names` (i18n), `version_groups` (refs), `pokemon_entries` (species + entry number)
- DB tables: `pokedexTable`, `pokedexNamesTable`, `pokedexDescriptionsTable`, `pokedexVersionGroupsTable`, `pokemonSpeciesPokedexNumbersTable` ([pokedex.ts:17-109](../../../database/schemas/pokeapi/pokedex.ts))
- Persisted ↔ JSON: **1:1 full coverage** — id, name, isMainSeries, regionId (nullable), synthesized URL, names, descriptions, version_groups, pokemon_entries fully flattened
- **Dropped:** none
- **DB columns without JSON source:** none
- Seed handling: [seed.ts:2062-2119](../../../database/seeds/pokeapi/seed.ts) — full coverage; all nested arrays properly denormalized
- Issues: none

## Preservation-list touches
None.

## Group-level observations

1. **Pokedex is exemplary** — comprehensive flattening, every JSON field captured.
2. **Region has minor convenience gaps** (main_generation, version_groups) but core data is intact.
3. **Location-area has a CRITICAL omission**: `encounter_method_rates` and `pokemon_encounters` together represent the entire wild-encounter dataset, and both are dropped. This is the single biggest data gap found in the audit so far. **Confirm with Batch 12** (pokemon-location-area) which holds the same structure from the pokemon side.
4. **`game_indices` recurring pattern**: pokemon, locations, types, versions all have per-version IDs that are inconsistently persisted. Worth a unified approach in recommendations.
