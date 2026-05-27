# 09 — Pokemon core (HEAVY)
**Endpoints:** pokemon (1351 — sampled bulbasaur/1; spot-checked sprite shape from 1.json line 14000+)
**Schema files touched:** pokemon.ts

## pokemon

- Files sampled: 1.json (bulbasaur, top + sprites region); structural inferences from pokemon.ts schema + seed.ts:2187-2372 for all other shapes
- JSON top-level fields:
  - Scalars: `id, name, base_experience, height, weight, order, is_default`
  - References: `species` (`{name,url}`), `location_area_encounters` (URL string)
  - Audio: `cries.{latest, legacy}` (URL strings, nullable)
  - Arrays: `abilities[]`, `types[]`, `stats[]`, `moves[]`, `forms[]`, `game_indices[]`, `held_items[]`, `past_types[]`, `past_abilities[]`, `past_stats[]`
  - Object: `sprites` (deeply nested — top-level variants + `other.<source>.<variant>` + `versions.<gen>.<game>.<variant>` + `versions.*.*.animated.<variant>`)
- DB tables ([pokemon.ts](../../../database/schemas/pokeapi/pokemon.ts)):
  - `pokemonTable` ([pokemon.ts:25-40](../../../database/schemas/pokeapi/pokemon.ts)) — scalar fields + cryLatest/cryLegacy + pokemonSpeciesId FK
  - `pokemonAbilitiesTable` (pokemon.ts:42-62) — unique (pokemonId, slot)
  - `pokemonTypesTable` (pokemon.ts:64-83) — unique (pokemonId, slot)
  - `pokemonStatsTable` (pokemon.ts:85-105) — unique (pokemonId, statId)
  - `pokemonMovesTable` (pokemon.ts:107-136) — unique (pokemonId, moveId, versionGroupId, moveLearnMethodId)
  - `pokemonGameIndicesTable` (pokemon.ts:138-157) — unique (pokemonId, versionId)
  - `pokemonHeldItemsTable` (pokemon.ts:159-182) — unique (pokemonId, itemId, versionId)
  - `pokemonPastTypesTable` (pokemon.ts:184-207) — unique (pokemonId, generationId, slot)
  - `pokemonPastAbilitiesTable` (pokemon.ts:209-229) — unique (pokemonId, generationId, slot); `abilityId` nullable (some past_abilities have ability=null in JSON)
  - **`pokemonSpritesTable`** (pokemon.ts:231-250) — **CUSTOM ADDITION — PRESERVE** — `(pokemonId, source, variant, url)` with unique (pokemonId, source, variant)
  - `pokemonPastStatsTable` (pokemon.ts:252-274)
- Persisted columns ↔ JSON: comprehensive 1:1 mapping for every field documented in the `Pokemon` seed type ([seed.ts:2204-2235](../../../database/seeds/pokeapi/seed.ts)) except `forms` and `location_area_encounters`.
- Seed handling: [seed.ts:2187-2372](../../../database/seeds/pokeapi/seed.ts) — `seedPokemon()` processes pokemon ONE AT A TIME (memory-conscious — pokemon files are 100–500 KB). Uses `onConflictDoNothing()` only on the parent pokemonTable insert; child tables use `insertChunked`. `flattenSprites` ([seed.ts:2129-2185](../../../database/seeds/pokeapi/seed.ts)) handles three sprite paths:
  1. Top-level scalar URLs (excluding `other` and `versions`) → `source="default", variant=<key>`
  2. `sprites.other.<source>.<variant>` → `source=<source>, variant=<variant>`
  3. `sprites.versions.<gen>.<game>.<variant>` → `source=<game>, variant=<variant>` (note: `gen` is collapsed — only `game` is preserved as source, which is fine because game names are unique across gens)
  4. `sprites.versions.*.*.animated.<variant>` → `source="<game>-animated", variant=<variant>`
- **Dropped JSON fields:**
  - `forms` (reverse-link array) — **reconstructable** via `pokemonFormsTable.pokeApiId`
  - `location_area_encounters` (just a URL pointer) — orphan endpoint covered by Batch 12
- **DB columns without JSON source (custom — preserve):**
  - **`pokemonSpritesTable` (entire table)** — CONFIRMED PRESERVE. Schema is comprehensive and flatten logic handles all known sprite paths in PokeAPI's nested object.
  - `pokemonTable.url` — synthesized from `id` in seed (line 2268); not in JSON. Same pattern across most tables.
- Issues / questions:
  - **`pokemonSpritesTable.url`** is `varchar(500)` — confirm long PokeAPI sprite paths fit (longest I saw was ~150 chars; 500 is safe).
  - **`flattenSprites` collapses generation prefix** in `versions.<gen>.<game>` — relies on game names being globally unique. Documented assumption that holds in current PokeAPI data.
  - **`onConflictDoNothing()` on parent pokemonTable** (seed.ts:2270) is appropriate for re-seed idempotency, but on the child tables (`insertChunked` without onConflict) a re-seed would error. Should be intentional — re-seeding wipes via truncateAllTables in tests.
  - **No index on `pokemonTable.pokemonSpeciesId`** — common lookup path, should have index.

## Preservation-list touches

**CONFIRMED PRESERVE — `pokemonSpritesTable`** (pokemon.ts:231-250). Coverage of nested sprites object is comprehensive:
- ✓ 8 top-level variants (front_default, back_default, front_shiny, back_shiny, front_female, back_female, front_shiny_female, back_shiny_female) — captured as `source="default"`
- ✓ `other.{dream_world, home, official-artwork, showdown}` — captured as `source=<key>`
- ✓ `versions.<gen>.<game>.<variant>` for all 9 generations — captured as `source=<game>`
- ✓ Animated nested object (gen-V black-white) — captured as `source=<game>-animated`

Also confirmed preserved (cannot be removed without data loss):
- `pokemonTable.cryLatest` / `cryLegacy` — map to `cries.latest` / `cries.legacy`. Custom flat-column choice (instead of a `pokemonCriesTable`) is intentional for query simplicity.

## Group-level observations

1. **Pokemon endpoint is the most comprehensively persisted** in the entire audit — every documented JSON field has a target table.
2. **`onConflictDoNothing` on the parent only** is a subtle pattern — re-seed will fail noisily on child tables. This is OK for the test wipe pattern but worth documenting.
3. **The one-at-a-time loop** (seed.ts:2248) is critical because the full set is multi-gigabyte if all loaded simultaneously.
4. **Missing index on `pokemonSpeciesId`** is the only real schema issue here — flag for Batch 13.
