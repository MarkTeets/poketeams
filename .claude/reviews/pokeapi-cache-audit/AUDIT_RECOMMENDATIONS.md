# PokeAPI Schema & Seed Audit — Recommendations

Generated 2026-05-27. Source notes in this directory (`01-*.md` through `13-*.md`). Cross-reference: [AUDIT_COVERAGE.md](AUDIT_COVERAGE.md).

This is an execution checklist. Each item is one sentence + file/line reference, written so a follow-up Claude session can act on it without re-deriving findings.

---

## Section A — Preservation contract (DO NOT REGRESS)

These custom columns/tables exist for application-specific reasons. Any "cleanup" recommendation that would remove them is wrong.

| Item | Location | Why preserved |
|---|---|---|
| `pokemonSpritesTable` (entire table) | [pokemon.ts:231-250](../../../database/schemas/pokeapi/pokemon.ts) | Flattens PokeAPI's deeply-nested `sprites` object into queryable rows for the app's sprite-loader. Removing would force the app to re-parse the nested JSON at query time. |
| `pokemonTable.cryLatest`, `cryLegacy` | [pokemon.ts:37-38](../../../database/schemas/pokeapi/pokemon.ts) | Flat audio-URL columns instead of a separate `pokemonCriesTable`. Intentional ergonomic choice. |
| `pokemonSpeciesEvolutionsTable.baseForm` | [pokemon-species.ts:262](../../../database/schemas/pokeapi/pokemon-species.ts) | Required by [`collectEvolutions()` at seed.ts:1954-1970](../../../database/seeds/pokeapi/seed.ts) to disambiguate regional-form evolutions (e.g. meowth-galar → perrserker). |
| `pokemonSpeciesEvolutionsTable.usedMoveId` | [pokemon-species.ts:238](../../../database/schemas/pokeapi/pokemon-species.ts) | Maps `evolution_details.used_move`; only place this evolution-condition variant is captured. |
| `pokemonSpeciesEvolutionsTable.evolveStartPokemonId`, `evolveEndPokemonId` | [pokemon-species.ts:226, 231](../../../database/schemas/pokeapi/pokemon-species.ts) | Implicit FKs to specific pokemon **forms** (not species). Enable form-aware evolution queries that species-level FKs alone cannot answer. |

**Verification:** Batch 11's preservation check confirmed no orphan custom columns exist beyond these. Any new column added to `pokemon.ts` or `pokemon-species.ts` going forward should either (a) have a clean 1:1 JSON mapping, or (b) be added to this section.

---

## Section B — Schema additions (new columns / tables for missing JSON data)

### [high] Add `wildEncountersTable` + `wildEncounterConditionValuesTable`

Closes the biggest data gap: `location-area.pokemon_encounters` (Batch 08) AND the orphan `pokemon-location-area/*` (Batch 12). ~10 MB of cached data currently unused.

**Files to create/modify:**
- [database/schemas/pokeapi/encounters.ts](../../../database/schemas/pokeapi/encounters.ts) — add two tables.
- [database/seeds/pokeapi/seed.ts](../../../database/seeds/pokeapi/seed.ts) — add `seedWildEncounters()` reading from `pokemon-location-area/*.json` (cleaner per-pokemon shape than location-area). Skip empty arrays (eternatus/890, alt-forms 10001+).

**Proposed shape:**
```ts
wildEncountersTable {
  wildEncounterId: integer().primaryKey().generatedAlwaysAsIdentity(),
  pokemonId: integer().notNull().references(() => pokemonTable.pokemonId),
  locationAreaId: integer().notNull().references(() => locationAreasTable.locationAreaId),
  versionId: integer().notNull().references(() => versionsTable.versionId),
  encounterMethodId: integer().notNull().references(() => encounterMethodsTable.encounterMethodId),
  minLevel: integer().notNull(),
  maxLevel: integer().notNull(),
  chance: integer().notNull(),  // individual encounter chance, 0-100
  ...timestamps,
}
// Multiple condition values per encounter row (e.g., "morning" + "swarm")
wildEncounterConditionValuesTable {
  wildEncounterId: integer().notNull().references(() => wildEncountersTable.wildEncounterId),
  encounterConditionValueId: integer().notNull().references(...),
  ...timestamps,
  // composite PK
}
```
Notes: surrogate PK required (same tuple repeats with different condition_value sets). Do NOT store derived `max_chance`.

### [medium] Add `pokemonSpeciesFormDescriptionsTable`

Captures `pokemon-species.form_descriptions[]` (i18n descriptions of forms for multi-form species like deoxys). Currently dropped.

**File:** [database/schemas/pokeapi/pokemon-species.ts](../../../database/schemas/pokeapi/pokemon-species.ts). Follows the `pokemonSpeciesGeneraTable` pattern at [pokemon-species.ts:118-137](../../../database/schemas/pokeapi/pokemon-species.ts).

### [medium] Add `growthRateLevelsTable`

Captures `growth-rate.levels[]` — full 100-row EXP-per-level table per growth rate. Useful for EXP/level calculations; currently dropped.

**File:** [database/schemas/pokeapi/regions.ts](../../../database/schemas/pokeapi/regions.ts) (where `growthRatesTable` lives). Shape: `(growthRateId, level, experience)` with unique `(growthRateId, level)`.

### [medium] Add `itemSpritesTable` OR `itemsTable.spriteUrl` column

`item.sprites.default` (single URL per item) is dropped. Either add a flat column (simplest — most items have only one sprite) or a sprite table for parity with pokemon.

**Recommended:** add `spriteUrl: varchar(500)` directly on `itemsTable` ([items.ts](../../../database/schemas/pokeapi/items.ts)).

### [low] Add `regionsTable.mainGenerationId`

`region.main_generation` is dropped. Single nullable FK column. Useful for "which region was introduced in Gen X".

### [low] Add `regionVersionGroupsTable` junction

`region.version_groups[]` is dropped. M2M between regions and version_groups. Lets you answer "which games take place in Sinnoh".

### [low] Add `locationGameIndicesTable`

`location.game_indices[]` (per-version location IDs) is dropped. Same pattern as `pokemonGameIndicesTable`.

### [medium] Add `typeSpritesTable`

`type.sprites` holds per-game type icon URLs (name_icon + symbol_icon variants) across all gens. Currently dropped (Batch 03). Structure mirrors `pokemonSpritesTable` exactly.

**File:** [database/schemas/pokeapi/types.ts](../../../database/schemas/pokeapi/types.ts). Proposed shape:
```ts
typeSpritesTable {
  typeSpriteId: integer().primaryKey().generatedAlwaysAsIdentity(),
  typeId: integer().notNull().references(() => typesTable.typeId),
  generationId: integer().notNull().references(() => generationsTable.generationId),  // resolved from JSON's "generation-iii" name via lookup
  gameName: varchar({ length: 100 }).notNull(),     // e.g. "scarlet-violet", "diamond-pearl"
  variant: varchar({ length: 50 }).notNull(),       // "name_icon" | "symbol_icon"
  url: varchar({ length: 500 }).notNull(),
}
// uniqueIndex on (typeId, gameName, variant)
```

JSON shape (from fire/10.json): `sprites.<generation-name>.<game>.{name_icon, symbol_icon}` — many `symbol_icon` values are null and should be skipped, same pattern as `flattenSprites` in [seed.ts:2129](../../../database/seeds/pokeapi/seed.ts). The `generation-name` strings (e.g. "generation-iii") need name → generationId lookup; build a one-time `generationNameMap` in the seeder.

**Seed:** add `seedTypeSprites()` following [`flattenSprites` at seed.ts:2129-2185](../../../database/seeds/pokeapi/seed.ts) as a template.

### [low] Add `moveContestCombosTable`

`move.contest_combos.{normal,super}.{use_before,use_after}[]` arrays are dropped. Shape: `(moveId, pairedMoveId, kind, position)` where kind ∈ {normal, super} and position ∈ {before, after}. Only useful if the app shows contest planning.

### [low] Add gender-rate persistence for `gender` endpoint

Currently `gender.pokemon_species_details` is dropped, but the same data lives in `pokemon_species.gender_rate` (which IS persisted). **No new table needed** — verify the app queries species directly for gender rates, then mark this as covered.

### [low] Decide: capture `*_history` data?

Recurring pattern (Batches 03, 04, 05 + pokemon.past_*): `type.past_damage_relations`, `ability.effect_changes`, `move.past_values`, `move.effect_changes`. The pokemon-side history (past_types, past_abilities, past_stats) IS captured; the move/ability/type sides are not. Either:
- (a) Add per-endpoint history tables for parity, OR
- (b) Explicitly document "historical balance data is out of scope; query current values only."

Recommend (b) unless the app grows a "Pokémon balance changelog" feature.

---

## Section C — Schema fixes (best-practice issues)

### [high] Add missing FK indexes

Direct query performance impact in [pokeapi.server.ts](../../../app/models/pokeapi.server.ts):

```ts
// Add to existing tables
pokemonTable: index on pokemonSpeciesId
pokemonSpeciesTable: index on evolvesFromSpeciesId
pokemonSpeciesTable: index on evolutionChainId
pokemonFormsTable: index on pokeApiId
pokemonSpeciesEvolutionsTable: index on evolutionChainId  AND on evolveStartSpeciesId
```

Use `index("...")` (non-unique) Drizzle helper in each table's `(table) => [...]` config block.

### [high] Add `.references()` to species self-reference + evolution-chain FK

Currently plain `integer()` with no FK constraint:
- [pokemon-species.ts:64](../../../database/schemas/pokeapi/pokemon-species.ts) — `evolvesFromSpeciesId` → `.references(() => pokemonSpeciesTable.pokemonSpeciesId)` (self-ref OK in Drizzle)
- [pokemon-species.ts:65](../../../database/schemas/pokeapi/pokemon-species.ts) — `evolutionChainId` → `.references(() => evolutionChainsTable.evolutionChainId)`

The other two implicit FKs (varieties.pokemonId, evolutions.evolveStart/EndPokemonId) are documented circular-import workarounds — leave as is.

### [high] Drop all per-row timestamps from pokeapi tables, add `meta.pokeapi_seed_runs`

**Rationale:** pokeapi tables are truncate-and-reseed only — they never see incremental writes, so `createdAt`/`updatedAt`/`deletedAt` carry no information (every row in a given table has identical values, and `deletedAt` is never set). That's ~3 unused columns × 135 tables = ~405 columns of wasted storage and noise in `SELECT *` queries.

**Approach:**

1. **Create a new `meta` Postgres schema** with a single table tracking each seed run:
   ```ts
   // database/schemas/meta.ts
   import { integer, pgSchema, text, timestamp, varchar } from "drizzle-orm/pg-core";

   const metaSchema = pgSchema("meta");

   export const pokeapiSeedRunsTable = metaSchema.table("pokeapi_seed_runs", {
     pokeapiSeedRunId: integer().primaryKey().generatedAlwaysAsIdentity(),
     startedAt: timestamp().defaultNow().notNull(),
     completedAt: timestamp(),                  // null while in progress
     status: varchar({ length: 20 }).notNull(), // "running" | "success" | "failed"
     sourceCommit: varchar({ length: 40 }),     // git SHA of poketeams at seed time
     pokeapiSnapshotDate: timestamp(),          // mtime of server-cache (when the cache itself was last refreshed)
     tableRowCounts: text(),                    // JSON blob: {"pokeapi.moves": 938, ...}
     notes: text(),                             // free-form: "post-gen-10 release", etc.
   });
   ```
   Lives outside `pokeapi` schema so it's not truncated during seed.

2. **Update [seed.ts](../../../database/seeds/pokeapi/seed.ts)** to bracket the entire run:
   - Insert a `{status: "running", startedAt: now()}` row at the top
   - On success: update with `status: "success", completedAt: now(), tableRowCounts: <collected counts>`
   - On failure: update with `status: "failed"`

3. **Modify [columnHelpers.ts:4-10](../../../database/utils/columnHelpers.ts)** to split:
   ```ts
   // app-owned tables (trainer.*, app_user.*) — keep full timestamps
   export const timestamps = {
     createdAt: timestamp().defaultNow().notNull(),
     updatedAt: timestamp().notNull().$onUpdate(() => new Date()),
     deletedAt: timestamp(),
   };
   // pokeapi.* tables — nothing
   // (intentional: per-row timestamps are meaningless for truncate-and-reseed data;
   //  see meta.pokeapi_seed_runs for the audit trail)
   ```

4. **Remove `...timestamps,` from every table declaration** in [database/schemas/pokeapi/](../../../database/schemas/pokeapi/) (18 files, ~135 tables). Generate one migration that drops `created_at`, `updated_at`, `deleted_at` from every `pokeapi.*` table.

5. **Verify [trainer.ts](../../../database/schemas/trainer.ts) and [app_user.ts](../../../database/schemas/app_user.ts) still use the helper** — those tables genuinely change over time and need it.

**Tradeoff:** queries that previously did `WHERE updated_at > $cursor` against pokeapi tables will no longer work, but no such queries exist today (pokeapi data is treated as static between seeds). Migration is a one-shot drop.

### [medium] Add `relations()` to schema.ts

Currently no `relations()` declared → models use verbose explicit `.leftJoin().on()`. Adding relations enables `db.query.<table>.findFirst({ with: { ... } })` style. Highest-value paths:
- `pokemonSpecies` ↔ `evolutionChain`, `evolvesFromSpecies` (self), `varieties`, `evolutions`
- `pokemon` ↔ `species`, `forms`, `abilities`, `types`, `stats`, `sprites`

This unblocks the commented-out [`getEvolutionChain` at pokeapi.server.ts:300-380](../../../app/models/pokeapi.server.ts) (currently abandoned).

### [medium] Add unique index to `pokemonSpeciesEvolutionsTable`

[pokemon-species.ts:213-265](../../../database/schemas/pokeapi/pokemon-species.ts) has no unique index — re-seed without truncation would duplicate. Add:
```ts
uniqueIndex("pse_chain_start_end_trigger_conditions_unique").on(
  evolutionChainId, evolveStartSpeciesId, evolveEndSpeciesId, triggerId,
  itemId, heldItemId, knownMoveId, usedMoveId, minLevel, timeOfDay,
  baseForm,
)
```
Test carefully — many of those columns are nullable and Postgres treats `NULL` as distinct in unique indexes.

### [low] Make `pokemonFormsTable.formIdentifier` nullable

Currently `notNull()` but stores empty strings for default forms (Batch 10). Either nullable or split.

### [low] Add `.onConflictDoNothing()` to all child-table inserts in seed

Currently only parent inserts are idempotent. For production-safe re-seed, child inserts should also skip on conflict. Alternatively, document "seed assumes empty schema" explicitly in [seed.ts](../../../database/seeds/pokeapi/seed.ts) header.

### [low] CHECK constraints on small enums

- `typeEfficacyTable.damageFactor` ∈ {0, 25, 50, 100, 200} (it's a percent)
- `pokemonSpeciesTable.genderRate` BETWEEN -1 AND 8

Defensive; not strictly needed.

### [low] Widen URL columns

Most `varchar(255)`. Some sprite paths approach the limit. Either:
- Standardize all URL columns to `varchar(500)`, OR
- Use `text` for URL columns (no width limit; tiny perf cost in PG).

---

## Section D — Seed-script updates (driven by Section B additions)

For each Section B addition, the corresponding seed work:

1. **Wild encounters:** add `seedWildEncounters()` reading `pokemon-location-area/*.json`. Skip empty arrays. Sample shape in [Batch 12 notes](12-pokemon-encounters.md). Run after `seedPokemon`, `seedLocationAreas`, `seedEncounterMethods`, `seedEncounterConditionValues`.

2. **Form descriptions:** extend `seedPokemonSpecies()` ([seed.ts:1793-1907](../../../database/seeds/pokeapi/seed.ts)) — current `Species` type omits `form_descriptions`. Add `form_descriptions: { description: string; language: { url: string } }[]` and an `insertChunked(pokemonSpeciesFormDescriptionsTable, ...)` block.

3. **Growth rate levels:** extend the growth-rates seeder to read `levels[]` and insert into the new table.

4. **Item sprites:** in items seeder, add `spriteUrl: item.sprites?.default ?? null` to the insert.

5. **Type sprites:** add `seedTypeSprites()` reading `type/*.json` `sprites.<generation>.<game>.{name_icon, symbol_icon}` nested object. Skip null URLs. Build a `generationNameMap` (name → generationId) once at start. Pattern: parallel `flattenSprites` at [seed.ts:2129-2185](../../../database/seeds/pokeapi/seed.ts).

6. **Region main generation / version groups:** extend the regions seeder.

7. **Location game indices:** extend the locations seeder.

8. **Move contest combos:** extend the move seeder.

9. **Seed-run metadata:** wrap the entire seed entry-point in `meta.pokeapi_seed_runs` insert/update bracket (status: "running" → "success"/"failed"). Collect row counts as each table finishes seeding and serialize into `tableRowCounts` JSON blob.

**General hygiene during these changes:**
- Add `.onConflictDoNothing()` to every new insert path (Section C low-priority recommendation).
- Add the corresponding `.references()` declarations as you add FKs.
- After all migrations, run [`npm run db:migrate`](../../../package.json) for dev, [`npm run db:migrate:test`](../../../package.json) for test DBs.

---

## Section E — Out of scope / decisions deferred

Findings explicitly NOT recommended for action:

| Finding | Reason for skipping |
|---|---|
| `*Names` → unified polymorphic translations table | Would lose FK safety; tradeoff not worth it. Per-entity tables are fine. **Confirmed: keep current per-entity pattern.** |
| Composite PKs on junction tables (instead of surrogate + unique) | Saves an int, but breaks Drizzle ergonomics. Current pattern is consistent. |
| Persist `ability.effect_changes`, `type.past_damage_relations`, `move.past_values`, `move.effect_changes` | "Historical balance changelog" feature not on the roadmap. Pokemon-side history (past_types, past_abilities, past_stats) is enough for combat-relevant queries. |
| Persist most reverse-link arrays (`type.pokemon`, `ability.pokemon`, `item.held_by_pokemon`, etc.) | All reconstructable via existing junction tables. Documented intentional drops. |
| Persist `gender.pokemon_species_details` | Same data lives in `pokemon_species.gender_rate` which IS persisted. |
| Persist `characteristic.possible_values` | Derivable from `gene_modulo` at runtime if needed. Trivial to add later. |
| Persist `super-contest-effect.moves[]` | Reconstructable via `movesTable.superContestEffectId` (which is persisted). |
| Convert PokeAPI IDs to surrogate PKs everywhere | PokeAPI IDs are stable; the renumber risk is theoretical. |

---

## Suggested execution order

If executing these recommendations, this order minimizes rework:

1. **Section C [high] schema fixes** — add missing FKs (evolvesFromSpeciesId, evolutionChainId), missing FK indexes, and unique index on `pokemonSpeciesEvolutionsTable`. One migration. Quick win.
2. **Section C [high] timestamp overhaul** — create `meta.pokeapi_seed_runs`, drop per-row timestamps from all pokeapi tables, update [columnHelpers.ts](../../../database/utils/columnHelpers.ts), wrap seed with metadata bracket. One big mechanical migration touching all 135 pokeapi tables. Best done as its own PR for reviewability.
3. **Section B [high]** — `wildEncountersTable` + seed. Closes the biggest data gap (~10 MB cached, zero consumption).
4. **Section B [medium]** — form_descriptions, growth-rate levels, item sprites, type sprites. Each is a small isolated addition; can be one PR or four.
5. **Section C [medium]** — add `relations()` for the heavy-join paths in [pokeapi.server.ts](../../../app/models/pokeapi.server.ts). Enables `db.query.*` style and unblocks the commented-out evolution query.
6. **[deferred] Generation-aware historical data** — see Section B "Decide: capture *_history data?" + ongoing design discussion. Will likely become `[high]` once the trainer-generation feature ships.
7. **Section C [low] + Section B [low]** — defer until prompted by a feature need.

Each numbered step is independent and can be its own PR.
