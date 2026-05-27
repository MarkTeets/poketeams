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

### [medium] Add `itemsTable.spriteUrl` flat column

**Decision:** flat column (not separate table). Most items have only one sprite URL — a separate table is overkill.

Add `spriteUrl: varchar({ length: 500 })` (nullable) directly on `itemsTable` ([items.ts](../../../database/schemas/pokeapi/items.ts)). Seed: `spriteUrl: item.sprites?.default ?? null`.

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

### [high] Add generation-aware historical data (drives trainer-generation feature)

**Decision:** **Pattern B** — base table holds latest values; parallel `*History*` tables hold per-generation (or per-version-group) overrides. Pokemon-side already follows this with `pokemonPastTypesTable` etc., but those names will be **renamed for consistency** with the new naming convention.

**Naming convention:** `<entity><Field>HistoryTable` (suffix-history). DB names use snake_case. Existing `pokemon_past_*` tables get renamed to `pokemon_*_history`.

#### Renames (existing pokemon-side tables)

| Current | New |
|---|---|
| `pokemonPastTypesTable` (`pokemon_past_types`) | `pokemonTypeHistoryTable` (`pokemon_type_history`) |
| `pokemonPastAbilitiesTable` (`pokemon_past_abilities`) | `pokemonAbilityHistoryTable` (`pokemon_ability_history`) |
| `pokemonPastStatsTable` (`pokemon_past_stats`) | `pokemonStatHistoryTable` (`pokemon_stat_history`) |

Migration uses `RENAME TABLE` (no data motion). Update [database/schemas/pokeapi/pokemon.ts](../../../database/schemas/pokeapi/pokemon.ts) and any imports.

#### New tables

| Source JSON | New table (camelCase / snake_case) | Shape |
|---|---|---|
| `type.past_damage_relations[]` | `typeEfficacyHistoryTable` / `type_efficacy_history` | surrogate PK, `(generationId, attackingTypeId, defendingTypeId, damageFactor)`. Mirrors `typeEfficacyTable` plus `generationId` discriminator. uniqueIndex on `(generationId, attackingTypeId, defendingTypeId)`. |
| `ability.effect_changes[]` | `abilityEffectHistoryTable` / `ability_effect_history` | surrogate PK, `(abilityId, versionGroupId, localLanguageId, effect, shortEffect)`. uniqueIndex on `(abilityId, versionGroupId, localLanguageId)`. |
| `move.past_values[]` scalars | `moveValueHistoryTable` / `move_value_history` | surrogate PK, `(moveId, versionGroupId, accuracy, effectChance, power, pp, typeId)` — all scalars nullable. uniqueIndex on `(moveId, versionGroupId)`. |
| `move.past_values[].effect_entries[]` | `moveValueHistoryEffectEntriesTable` / `move_value_history_effect_entries` | surrogate PK, FK to `moveValueHistoryTable` + `(localLanguageId, effect, shortEffect)`. uniqueIndex on `(moveValueHistoryId, localLanguageId)`. |
| `move.effect_changes[]` | `moveEffectHistoryTable` / `move_effect_history` | surrogate PK, `(moveId, versionGroupId, localLanguageId, effect)`. uniqueIndex on `(moveId, versionGroupId, localLanguageId)`. |

#### Query helper

Add `app/utils/generation-history.ts` exporting:
```ts
// Generic helper: resolve a field at a given generation by checking the history table
// first (most recent override <= trainerGeneration), falling back to the base table value.
export async function valueAtGeneration<T>(...)
```
Per-model logic can use this OR write its own SQL — both supported. The helper just spares the boilerplate for simple cases.

#### Discriminator: generation vs version_group

- **Type efficacy** changes are tracked by **generation** (Gen 6 added Fairy, Gen 1 ghost vs psychic, etc.) → use `generationId`.
- **Move past_values, ability/move effect_changes** are tracked by **version_group** in PokeAPI's data → use `versionGroupId`.

For trainer-gen queries against version-group-keyed history, resolve the trainer's selected generation to the latest version_group for that generation, then apply the same "most recent override <=" logic.

#### Trainer-generation query pattern

For a trainer that has selected generation N:
1. Look up overrides in the relevant history table where `generationId <= N` (or `versionGroupId.generationId <= N`), ordered DESC, take the first match.
2. If no override found, fall back to the base table's current value.
3. The helper utility wraps this; ad-hoc model queries can replicate inline.

#### When to seed

After all base tables and reference data are seeded — history tables FK back to types/moves/abilities/version-groups/generations/languages which must exist first.

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

4. **Remove `...timestamps,` from every table declaration** in [database/schemas/pokeapi/](../../../database/schemas/pokeapi/) (18 files, ~135 tables). The migration is regenerated from scratch (see testing strategy below) — no need to hand-craft `ALTER TABLE` statements.

5. **Leave [trainer.ts](../../../database/schemas/trainer.ts) and [app_user.ts](../../../database/schemas/app_user.ts) untouched** — those tables genuinely change over time and need the full `timestamps` helper.

**Migration testing strategy — clean-slate regeneration:**

Because the cumulative schema refactor (this timestamps overhaul + historical-data tables + renames + FK index additions + relations() + wild encounters + sprites + everything else) touches ~135 tables in a way that produces a noisy, hard-to-review incremental migration diff, the cleaner approach is to wipe and regenerate:

1. **Delete all existing migration files** in [drizzle-migrations/](../../../drizzle-migrations/) (or wherever the project keeps them).
2. **Drop the dev and test databases entirely** (`npm run db:down`, `npm run test-db:down`, then back up — the dev DB is the only one with persistent storage; the test DB uses tmpfs so it resets on `down`).
3. **Run `npm run db:generate`** — produces a single fresh "initial schema" migration reflecting the new desired state.
4. **Run `npm run db:migrate`** (dev) + `npm run db:migrate:test` (test DBs) to create all tables.
5. **Reseed in order:**
   - `npm run pokeapi:seed` — populates pokeapi tables from the cache at [server-cache/pokeapi.co/api/v2/](../../../server-cache/pokeapi.co/api/v2/). This is the heavy one.
   - `npm run db:seed` — populates fixture data ([database/seeds/fixtures.ts](../../../database/seeds/fixtures.ts)) which depends on pokeapi reference data existing (FKs from trainer-owned data into pokeapi).
6. **Run `npm run test`** (full suite — unit + e2e). E2E is the primary gate: it exercises the full auth flow + DB end-to-end, so any schema/query mismatch surfaces.

This avoids the migration-diff churn from incrementally walking through column drops, renames, and additions. Acceptable because:
- No production data is in flight; everything is regenerable from the cache + seed.
- Migration history is a tool for production schema evolution; during pre-prod heavy refactoring, a clean slate is easier to verify.

**Tradeoff:** queries that previously did `WHERE updated_at > $cursor` against pokeapi tables will no longer work, but no such queries exist today (pokeapi data is treated as static between seeds).

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

### [low] Widen URL columns to `varchar(500)`

**Decision:** standardize all URL columns to `varchar(500)`. Most are currently `varchar(255)`; sprite-path URLs in particular approach the limit. Touch every `varchar({ length: 255 })` used on a URL-typed column. Excludes name/identifier columns which can stay at 255.

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

10. **Historical data — pokemon-side renames:** mechanical rename in [seed.ts](../../../database/seeds/pokeapi/seed.ts) for the three pokemon `past_*` insert sites — only the table identifiers change, no logic changes. Existing seed sections work as-is against the renamed tables.

11. **Historical data — new tables:**
    - `seedTypeEfficacyHistory()` reading `type.past_damage_relations[]` for each cached type file. Flatten 6 sub-arrays per generation snapshot the same way the current type-efficacy seeder flattens `damage_relations`. Resolve generation name → generationId via `generationNameMap`.
    - `seedAbilityEffectHistory()` reading `ability.effect_changes[]`. Per `effect_changes` entry, insert one row per language in `effect_entries`. (Ability effect_changes typically has no `short_effect` so allow nullable.)
    - `seedMoveValueHistory()` reading `move.past_values[]`. Insert one row per past_values entry into `moveValueHistoryTable`, then for each entry's `effect_entries[]`, insert into `moveValueHistoryEffectEntriesTable` keyed by the just-inserted parent row.
    - `seedMoveEffectHistory()` reading `move.effect_changes[]`. Same shape as ability effect history.
    - All five run AFTER `seedPokemon`, `seedMoves`, `seedAbilities`, `seedTypes`, `seedGenerations`, `seedVersionGroups`, `seedLanguages` — because they FK back to all of those.

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

Because the migration testing strategy uses **clean-slate regeneration** (wipe migration history, drop dev/test DBs, regenerate from current schema state, reseed, run e2e), all schema-touching changes naturally bundle into a single batch — there's no benefit to splitting them into multiple PRs since each one would invalidate the previous migration history.

Two phases:

### Phase 1 — Single bundled schema overhaul PR

All `[high]` and `[medium]` items at once, since they share one migration regeneration:

1. **Schema fixes** — FK indexes, `.references()` additions (evolvesFromSpeciesId, evolutionChainId), unique index on `pokemonSpeciesEvolutionsTable`, add `relations()` declarations in [schema.ts](../../../database/schema.ts).
2. **Timestamps overhaul** — create `meta` schema + `pokeapiSeedRunsTable`, remove `...timestamps,` from all pokeapi table declarations (leave trainer/app_user untouched), update [columnHelpers.ts](../../../database/utils/columnHelpers.ts).
3. **New tables** — `wildEncountersTable` + `wildEncounterConditionValuesTable`, `typeSpritesTable`, `pokemonSpeciesFormDescriptionsTable`, `growthRateLevelsTable`. Add `itemsTable.spriteUrl` flat column.
4. **Historical data renames** — `pokemonPastTypesTable` → `pokemonTypeHistoryTable`, `pokemonPastAbilitiesTable` → `pokemonAbilityHistoryTable`, `pokemonPastStatsTable` → `pokemonStatHistoryTable`.
5. **Historical data new tables** — `typeEfficacyHistoryTable`, `abilityEffectHistoryTable`, `moveValueHistoryTable`, `moveValueHistoryEffectEntriesTable`, `moveEffectHistoryTable`.
6. **URL column widening** — every `varchar(255)` on a URL column → `varchar(500)`.
7. **Seed-script extensions** — all of §D items 1–11 (new tables + history renames + seed-run metadata bracket + helper utility `app/utils/generation-history.ts`).
8. **Run the regeneration:** delete migration files, drop dev + test DBs, then in order:
   - `npm run db:generate`
   - `npm run db:migrate` (dev) + `npm run db:migrate:test` (test DBs)
   - `npm run pokeapi:seed` — seeds the pokeapi tables from the cache (heavy)
   - `npm run db:seed` — seeds fixture data, depends on pokeapi data being present
   - `npm run test` — full unit + e2e suite

### Phase 2 — Follow-up small PRs (independent, low-risk)

These don't require schema changes and can ship anytime after Phase 1:

9. **Section B [low]** — `moveContestCombosTable`, `regionsTable.mainGenerationId` (add as nullable column), `regionVersionGroupsTable`, `locationGameIndicesTable`. Each is a small isolated addition; bundle with whatever seed code is being touched.
10. **Section C [low] nits** — make `pokemonFormsTable.formIdentifier` nullable, add `.onConflictDoNothing()` to all child-table seed inserts, CHECK constraints on small enums. Touch alongside related work.

Phase 1 is the big bang; Phase 2 is cleanup. Both phases can be re-validated with the same clean-slate testing approach.
