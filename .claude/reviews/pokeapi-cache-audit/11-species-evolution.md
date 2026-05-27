# 11 — Pokemon species + evolution (PRESERVATION-HEAVY)
**Endpoints:** pokemon-species (1026 — sampled bulbasaur/1; inferred patterns for multi-form/baby/legendary/regional from schema + seed), evolution-chain (542 — sampled eevee/67 — multi-branch with item/level/happiness/location/move-type conditions)
**Schema files touched:** pokemon-species.ts

## pokemon-species

- Files sampled: bulbasaur/1 (read full); inferences via schema + seed for multi-form species, babies, regional evolvers
- JSON top-level fields (inventoried from bulbasaur/1):
  - Scalars: `id, name, order, gender_rate, capture_rate, base_happiness, is_baby, is_legendary, is_mythical, hatch_counter, has_gender_differences, forms_switchable`
  - References: `generation, growth_rate, color, shape (nullable), habitat (nullable), evolves_from_species (nullable), evolution_chain (nullable)`
  - Multilingual arrays: `names[]`, `flavor_text_entries[]` (uses `version` not `version_group`!), `genera[]`, `form_descriptions[]` (multi-form species only)
  - Nested arrays: `egg_groups[]`, `pal_park_encounters[]` (with base_score, rate, area), `pokedex_numbers[]` (entry_number, pokedex), `varieties[]` (is_default, pokemon ref)
- DB tables ([pokemon-species.ts](../../../database/schemas/pokeapi/pokemon-species.ts)):
  - `pokemonSpeciesTable` (line 37-67) — scalar + FKs
  - `pokemonSpeciesNamesTable` (line 69-88) — unique (pokemonSpeciesId, localLanguageId)
  - `pokemonSpeciesFlavorTextsTable` (line 91-116) — unique (pokemonSpeciesId, localLanguageId, versionId) — note: versionId not versionGroupId, comment at line 90 explains why
  - `pokemonSpeciesGeneraTable` (line 118-137)
  - `pokemonSpeciesEggGroupsTable` (line 139-159) — unique (pokemonSpeciesId, eggGroupId)
  - `pokemonSpeciesPalParkEncountersTable` (line 161-181) — unique (pokemonSpeciesId, palParkAreaId)
  - `evolutionChainsTable` (line 184-189) — id, url, babyTriggerItemId
  - `pokemonSpeciesVarietiesTable` (line 191-209) — implicit FK to pokemon
  - `pokemonSpeciesEvolutionsTable` (line 213-265) — **the preservation-heavy table**
- Persisted columns ↔ JSON: full coverage of all scalar fields and most arrays via `seedPokemonSpecies()` at [seed.ts:1793-1907](../../../database/seeds/pokeapi/seed.ts).
- **Dropped JSON fields:**
  - **`form_descriptions[]`** (i18n descriptions of forms for multi-form species like deoxys) — **arguably useful**; no table for this. Would need a `pokemonSpeciesFormDescriptionsTable`.
  - `pokedex_numbers[]` — **REDIRECTED**: persisted by the pokedex seeder (Batch 08) via `pokemon_species_pokedex_numbers` table (created from pokedex.pokemon_entries), not by species seeder. Equivalent data, different ingestion path.
  - `varieties[]` — **REDIRECTED**: persisted by `seedPokemonSpeciesVarieties()` at [seed.ts:2374-2391](../../../database/seeds/pokeapi/seed.ts).
- Seed handling: clean and comprehensive. `evolutionChainId` is **nullable on insert** and **backfilled** later at [seed.ts:2393-2409](../../../database/seeds/pokeapi/seed.ts) by `backfillEvolutionChainIds()` (because evolution_chains is seeded after species).
- Issues / questions:
  - **`form_descriptions` is the only species-level field with no destination.** Low priority unless app shows form descriptions.
  - **No FK on `evolvesFromSpeciesId`** (line 64) — declared as plain `integer()` with no `.references()`. Should be `.references(() => pokemonSpeciesTable.pokemonSpeciesId)` (self-reference is fine in Drizzle).
  - **No FK on `evolutionChainId`** (line 65) — same issue. Should reference evolutionChainsTable. Currently relies on application correctness during backfill.

## evolution-chain

- Files sampled: eevee/67 (eight-branch chain with conditions: use-item × 3, level-up+happiness+time-of-day × 2, level-up+location × 1, level-up+known-move-type+min-affection × 1)
- JSON top-level fields: `id`, `baby_trigger_item` (`{url}|null`), `chain` (recursive `ChainNode`)
- ChainNode shape: `{species, evolution_details[], evolves_to[], is_baby}` — recursive tree
- evolution_details fields (all confirmed present): `base_form, trigger, item, held_item, known_move, known_move_type, used_move, location, party_species, party_type, trade_species, region, gender (int|null), min_level, min_happiness, min_beauty, min_affection, min_damage_taken, min_move_count, min_steps, time_of_day, relative_physical_stats, needs_overworld_rain, needs_multiplayer, turn_upside_down`
- DB tables:
  - `evolutionChainsTable` ([pokemon-species.ts:184-189](../../../database/schemas/pokeapi/pokemon-species.ts)) — id, url, babyTriggerItemId (FK items)
  - `pokemonSpeciesEvolutionsTable` ([pokemon-species.ts:213-265](../../../database/schemas/pokeapi/pokemon-species.ts)) — denormalized "one row per edge" representation
- Persisted columns ↔ JSON: `collectEvolutions()` at [seed.ts:1941-2017](../../../database/seeds/pokeapi/seed.ts) walks the recursive tree, producing one row per parent→child edge per evolution_details entry. Mapping:
  - evolution_details.trigger → triggerId ✓
  - .item → itemId ✓
  - .held_item → heldItemId ✓
  - .known_move → knownMoveId ✓
  - .known_move_type → knownMoveTypeId ✓
  - **.used_move → usedMoveId** ✓ (was previously missing — added in commit ad9d6f2-style change)
  - .location → locationId ✓
  - .party_species → partySpeciesId ✓
  - .party_type → partyTypeId ✓
  - .trade_species → tradeSpeciesId ✓
  - .region → regionId ✓
  - .gender (int) → genderId ✓ (note: stored as int directly, not a FK lookup)
  - all `min_*` scalars ✓
  - .time_of_day → timeOfDay (empty string normalized to null) ✓
  - .relative_physical_stats → relativePhysicalStats ✓
  - .needs_overworld_rain, .needs_multiplayer, .turn_upside_down → booleans ✓
  - **.base_form.name → baseForm** ✓ (custom column — preserve)
  - Plus computed: `evolveStartSpeciesId`/`evolveEndSpeciesId` (from chain walk), `evolveStartPokemonId`/`evolveEndPokemonId` (from `pokemonNameMap` keyed by varieties.pokemon.name)
- **Dropped JSON fields:** `is_baby` on each ChainNode (info available via species.is_baby anyway)
- Seed handling: `seedEvolutionChains()` at [seed.ts:2019-2049](../../../database/seeds/pokeapi/seed.ts). Builds `pokemonNameMap` from species.varieties before walking chains, so form-specific pokemon names (e.g. "perrserker", "raichu-alola") resolve to specific pokemon IDs.
- Issues / questions:
  - `genderId` is stored as a raw int (matching PokeAPI's enum: 1=female-only, 2=male-only, 3=genderless?) without a `.references(gendersTable.genderId)` FK. This works because the seed passes `detail.gender` directly without URL resolution. Could be tightened with a FK.

## Preservation contract verification

### Confirmed preserved (custom additions — DO NOT REMOVE)

1. **`pokemonSpeciesEvolutionsTable.baseForm`** ([pokemon-species.ts:262](../../../database/schemas/pokeapi/pokemon-species.ts)) ✓ PRESERVE
   - Source: `evolution_details.base_form.name` (nullable)
   - Purpose: used in `collectEvolutions()` to determine the evolved form name suffix — e.g. when meowth-galar evolves to perrserker, `base_form.name = "meowth-galar"`, allowing the seed to look up `currentSpeciesName + "-galar"` = "perrserker"-galar in pokemonNameMap. Without this, regional evolutions resolve to the wrong (default) form.
   - **Reason to preserve:** essential to evolution-form disambiguation logic.

2. **`pokemonSpeciesEvolutionsTable.usedMoveId`** ([pokemon-species.ts:238](../../../database/schemas/pokeapi/pokemon-species.ts)) ✓ PRESERVE
   - Source: `evolution_details.used_move.url`
   - Purpose: maps to PokeAPI's `used_move` evolution condition (e.g. some legends-arceus evolutions). Distinct from `knownMoveId` (which is `known_move`).
   - **Reason to preserve:** the only place this evolution-condition variant is captured.

3. **`pokemonSpeciesEvolutionsTable.evolveStartPokemonId`** ([pokemon-species.ts:226](../../../database/schemas/pokeapi/pokemon-species.ts)) ✓ PRESERVE
   - Source: computed from `pokemonNameMap` based on `base_form.url` or species varieties
   - Purpose: links the evolution edge to the SPECIFIC pokemon form (not just species), enabling queries like "what does galarian-meowth evolve into?"
   - **Reason to preserve:** species-level FKs alone cannot answer form-specific evolution questions.

4. **`pokemonSpeciesEvolutionsTable.evolveEndPokemonId`** ([pokemon-species.ts:231](../../../database/schemas/pokeapi/pokemon-species.ts)) ✓ PRESERVE
   - Source: same logic as evolveStartPokemonId but for the target
   - **Reason to preserve:** same as above.

### Additional columns confirmed preserved

5. **`pokemonSpeciesEvolutionsTable.relativePhysicalStats`** ([pokemon-species.ts:257](../../../database/schemas/pokeapi/pokemon-species.ts)) — maps to `detail.relative_physical_stats`. Standard JSON mapping (NOT a custom addition).

### No orphan custom columns

Every column in `pokemonSpeciesEvolutionsTable` has either a clean 1:1 JSON source or is one of the 4 "computed for form disambiguation" custom additions listed above. No additional columns need to be added to the preservation contract.

## Group-level observations

1. **Evolution table is the most complex in the audit** — 25+ columns, each capturing a different PokeAPI evolution condition. Comprehensive.
2. **Form-aware evolution resolution is a real value-add** — generic PokeAPI consumers can't easily answer "what does perrserker evolve from?" because the species-level data points to meowth (the canonical species), not meowth-galar (the specific form). The custom columns + `collectEvolutions()` logic make this query trivial.
3. **`pokemonSpeciesTable.evolvesFromSpeciesId` and `.evolutionChainId` lack `.references()`** — should be fixed (self-reference + cross-table reference). Currently relies on backfill correctness.
4. **`form_descriptions` is the only species-level gap** — easy add if needed.
5. **`pokemonSpeciesEvolutionsTable` has NO unique index on its semantic key** — typically `(evolutionChainId, evolveStartSpeciesId, evolveEndSpeciesId, triggerId, *all other conditions*)`. With surrogate PK only, duplicate rows are possible on re-seed. Worth a `uniqueIndex` or accepting that re-seed wipes first.
