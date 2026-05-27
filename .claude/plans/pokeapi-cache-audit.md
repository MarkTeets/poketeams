# PokeAPI Cache vs DB Schema Audit — Plan

## Context

The repo has a full PokeAPI mirror cached at [server-cache/pokeapi.co/api/v2/](server-cache/pokeapi.co/api/v2/) (49 top-level endpoints, ~17k JSON files total) and a `pokeapi` Postgres schema with ~135 Drizzle tables in [database/schemas/pokeapi/](database/schemas/pokeapi/) seeded by [database/seeds/pokeapi/seed.ts](database/seeds/pokeapi/seed.ts) (2,587 lines). Recent commits have iterated on coverage (sprites, evolution details), but no systematic audit has been done to confirm which JSON fields are dropped vs persisted, or to validate the schema against SQL best practices.

This task produces a written audit + a prioritized recommendations checklist a follow-up Claude session can execute. **No code is changed in this pass.** Custom application-layer additions (sprites table, evolution `baseForm`/`usedMoveId`/`evolveStart*PokemonId`/`evolveEnd*PokemonId`) must be preserved and explicitly flagged in every batch's notes so the synthesis step does not regress them.

## Context-budget discipline (why this plan is batched)

A single Claude conversation cannot read all the cached JSON and all the schema files. The largest sample file ([pokemon/1.json](server-cache/pokeapi.co/api/v2/pokemon/1.json)) is 435 KB on its own; reading 10 of those plus 10 pokemon-species, 10 moves, etc. blows the window. To avoid mid-task auto-compaction, the audit is split into **isolated subagent batches**. Each batch:

1. Runs in a fresh Explore subagent (its own context window),
2. Reads only the schema files + JSON files relevant to its endpoint group,
3. Writes findings to a markdown file in `.claude/reviews/pokeapi-cache-audit/`,
4. Returns a ≤200-word summary to the main thread.

The main thread never holds raw JSON. After all batches finish, a final synthesis step reads the saved markdown notes and writes the recommendations + coverage matrix. Per the user's choice, the scratch notes live in a gitignored folder and the final output is a recommendations checklist + per-table coverage matrix.

## Where files go

All audit artifacts live **inside the repo** under `.claude/` so they're versioned and discoverable by future Claude sessions and humans alike. The repo already has `.claude/settings.local.json`; the new layout extends that:

```
.claude/
  plans/
    pokeapi-cache-audit.md          ← this plan (moved/copied here on approval)
  reviews/
    pokeapi-cache-audit/
      00-overview.md                ← summary + status board (written first, updated as batches complete)
      01-tiny-lookups.md            ← per-batch notes
      02-stats-natures.md
      ...
      13-schema-design.md
      AUDIT_PROCESS.md              ← reusable playbook (see "Reusable artifacts")
      AUDIT_RECOMMENDATIONS.md      ← final actionable checklist
      AUDIT_COVERAGE.md             ← per-table coverage matrix
      _sample-files.json            ← curated sample-file map
```

Everything in `.claude/reviews/pokeapi-cache-audit/` is committed to the repo — these aren't throwaway scratch notes, they're the audit record. The repo's [.gitignore](.gitignore) currently ignores nothing under `.claude/`, which is what we want; no change needed.

## Universal batch instructions (every Explore subagent gets these)

Every batch subagent receives the same standing rules:

1. **File selection per endpoint:** read the `__list.json` first, then pick up to 10 individual files that together exercise as many distinct shapes as possible. Prefer variety over sequential IDs — e.g., for `pokemon`, sample bulbasaur (basic), charizard (mega forms), pikachu (many forms), ditto (special), mewtwo, deoxys (multi-form), eternatus (DLC), and a couple of `1000x.json` alternate-form entries. For endpoints with ≤10 files total, read all of them.
2. **For each endpoint, produce:**
   - Top-level field inventory (every JSON key seen across the 10 samples, with an example value or shape)
   - Mapping to the corresponding Drizzle table(s) in [database/schemas/pokeapi/](database/schemas/pokeapi/) — column-by-column
   - List of JSON fields **not currently persisted** (with assessment: clearly useful / arguably useful / safe to skip)
   - List of DB columns **not present in the JSON** (custom additions — preserve)
   - Notes on how [database/seeds/pokeapi/seed.ts](database/seeds/pokeapi/seed.ts) consumes that endpoint (line refs); any silent drops or transformations
3. **Custom-addition preservation list (recheck every batch):**
   - `pokemonSpritesTable` ([pokemon.ts:231-250](database/schemas/pokeapi/pokemon.ts#L231-L250)) — flattened sprites, do not regress
   - `pokemonSpeciesEvolutionsTable` extras ([pokemon-species.ts:213-265](database/schemas/pokeapi/pokemon-species.ts#L213-L265)) — `baseForm`, `usedMoveId`, `evolveStartPokemonId`, `evolveEndPokemonId`
   - Any other field in [pokemon-species.ts](database/schemas/pokeapi/pokemon-species.ts) or [pokemon.ts](database/schemas/pokeapi/pokemon.ts) that does not have a clean 1:1 mapping in the JSON — flag, don't recommend removing
4. **Output destination:** write findings to `.claude/reviews/pokeapi-cache-audit/NN-<group>.md` using a fixed template (see "Notes template" below).
5. **Return value:** ≤200-word summary of (a) most surprising gaps, (b) anything that touches the preservation list, (c) the output file path.

## Notes template (each batch writes this shape)

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

(repeat per endpoint in the group)

## Group-level observations
(cross-endpoint patterns, naming inconsistencies, etc.)
```

## Batches (run sequentially, one Explore subagent each)

Endpoint counts in parens are file counts in the cache dir (informs sample selection).

**Batch 01 — Tiny lookups / reference data**
- Endpoints: `language` (14), `generation` (10), `version` (50), `version-group` (33), `gender` (4), `growth-rate` (7), `pokemon-color` (11), `pokemon-shape` (15), `pokemon-habitat` (10), `egg-group` (16), `evolution-trigger` (17), `move-damage-class` (4), `move-battle-style` (4), `move-target` (17), `move-category` (15), `move-learn-method` (12), `move-ailment` (23), `item-pocket` (9), `item-attribute` (9), `item-fling-effect` (8), `pal-park-area` (6), `pokeathlon-stat` (6), `contest-type` (6), `berry-firmness` (6), `berry-flavor` (6), `encounter-condition` (20), `encounter-condition-value` (192 — sample 10), `encounter-method` (56 — sample 10)
- Schemas: [languages.ts](database/schemas/pokeapi/languages.ts), [generations.ts](database/schemas/pokeapi/generations.ts), [pokemon-attributes.ts](database/schemas/pokeapi/pokemon-attributes.ts), [regions.ts](database/schemas/pokeapi/regions.ts) (partial), [encounters.ts](database/schemas/pokeapi/encounters.ts), [move-basics.ts](database/schemas/pokeapi/move-basics.ts), [items.ts](database/schemas/pokeapi/items.ts) (partial), [berries-and-contests.ts](database/schemas/pokeapi/berries-and-contests.ts) (partial), [stats.ts](database/schemas/pokeapi/stats.ts) (partial)

**Batch 02 — Stats, characteristics, natures**
- Endpoints: `stat` (10), `characteristic` (31 — sample 10), `nature` (26 — sample 10)
- Schemas: [stats.ts](database/schemas/pokeapi/stats.ts), [natures.ts](database/schemas/pokeapi/natures.ts)

**Batch 03 — Types**
- Endpoints: `type` (43 — sample 10 including a past-type entry like `unknown`)
- Schemas: [types.ts](database/schemas/pokeapi/types.ts)

**Batch 04 — Abilities**
- Endpoints: `ability` (372 — sample 10 mixing gen-1 and recent)
- Schemas: [abilities.ts](database/schemas/pokeapi/abilities.ts)

**Batch 05 — Moves**
- Endpoints: `move` (938 — sample 10 covering damage classes, status moves, z-moves, max moves, multi-hit, OHKO)
- Schemas: [moves.ts](database/schemas/pokeapi/moves.ts)
- Note: `move-basics.ts` already covered in Batch 01; recheck only if cross-refs surface

**Batch 06 — Items, berries, machines**
- Endpoints: `item` (2177 — sample 10 across categories: poke-balls, evolution-stones, key-items, machines, berries-as-items), `item-category` (55 — sample 10), `berry` (65 — sample 10), `machine` (2213 — sample 10 across version-groups)
- Schemas: [items.ts](database/schemas/pokeapi/items.ts), [berries-and-contests.ts](database/schemas/pokeapi/berries-and-contests.ts), [machines.ts](database/schemas/pokeapi/machines.ts)

**Batch 07 — Contests**
- Endpoints: `contest-effect` (34 — sample 10), `super-contest-effect` (23 — sample 10)
- Schemas: [berries-and-contests.ts](database/schemas/pokeapi/berries-and-contests.ts)

**Batch 08 — Regions, locations, pokedex**
- Endpoints: `region` (12), `location` (1097 — sample 10 across regions including special locations), `location-area` (1245 — sample 10), `pokedex` (36 — sample 10 including regional dexes)
- Schemas: [regions.ts](database/schemas/pokeapi/regions.ts), [pokedex.ts](database/schemas/pokeapi/pokedex.ts)

**Batch 09 — Pokemon core (HEAVY — read selectively)**
- Endpoints: `pokemon` (1351 — sample 10 prioritizing shape variety: bulbasaur/1, charizard/6, pikachu/25, ditto/132, mewtwo/150, greninja/658, deoxys/386, eternatus/890, an alternate-form 1000x file, a megaevolved file)
- Schemas: [pokemon.ts](database/schemas/pokeapi/pokemon.ts)
- **CRITICAL:** these JSONs are 100-500 KB. Read with `Read` tool's `limit`/`offset` if needed — focus on the top-level keys list and one example of each nested array element, not every element. Explicitly verify `pokemonSpritesTable` coverage of the nested `sprites` object (default, versions, other.{home,dream_world,official-artwork,showdown}).

**Batch 10 — Pokemon forms**
- Endpoints: `pokemon-form` (1579 — sample 10 including normal, mega, gmax, alolan/galarian/hisuian/paldean variants, totem forms)
- Schemas: [pokemon-forms.ts](database/schemas/pokeapi/pokemon-forms.ts)

**Batch 11 — Pokemon species + evolution (PRESERVATION-HEAVY)**
- Endpoints: `pokemon-species` (1026 — sample 10 incl. baby pokemon, legendaries, mythicals, multi-form species like deoxys, regional-evolvers like meowth), `evolution-chain` (542 — sample 10 incl. eevee chain (id 67), the long galarian-meowth/perrserker chain, a base-form chain, a trade-evolution chain, an item-evolution chain, a level-with-move chain, a happiness/affection chain)
- Schemas: [pokemon-species.ts](database/schemas/pokeapi/pokemon-species.ts)
- **This batch must explicitly re-verify the custom additions list in its notes and call out any that look orphaned vs. preserved.** Read the `collectEvolutions()` logic at [seed.ts:1941-2047](database/seeds/pokeapi/seed.ts#L1941-L2047) and confirm the mapping.

**Batch 12 — Pokemon encounters (orphan check)**
- Endpoints: `pokemon-location-area` (1350 — sample 10) — this is the `/pokemon/{id}/encounters` sub-resource, not in [resources.json](server-cache/pokeapi.co/api/v2/resources.json), and there is no table for it today
- Schemas: [encounters.ts](database/schemas/pokeapi/encounters.ts)
- Output: report whether this data is consumed at all by seed.ts, and recommend either a table or a documented "intentionally unused" note

## Batch 13 — Schema-design / best-practices review (no JSON)

This batch reads only the schema files + seed.ts; no cache JSON. Use one Explore subagent.

Checklist the subagent applies to every table:

- **Primary keys:** consistent type and naming (PokeAPI integer IDs vs. autogenerated surrogate IDs — is the choice consistent and justified per table?)
- **Naming conventions:** singular vs. plural table names, snake_case mapping, suffix consistency (`*sTable`, `*Names`, `*FlavorTexts`)
- **Indexes:** every FK has a supporting index? Composite indexes on the columns we actually query in [app/models/pokeapi.server.ts](app/models/pokeapi.server.ts)?
- **Foreign keys:** all relations expressed via `.references()` where possible? Document the intentional "implicit FK" cases (e.g., [pokemon-species.ts:191-209](database/schemas/pokeapi/pokemon-species.ts#L191-L209)) and check whether they could be resolved with a `relations()` declaration instead
- **Constraints:** `.notNull()` on columns that the JSON always supplies; unique indexes on every natural-key combo (e.g., `(pokemonId, slot)`); CHECK constraints for fixed enums (e.g., `move_damage_class.name`)
- **Soft delete:** does the `timestamps` helper's `deletedAt` make sense for reference data that is never deleted? Recommend per-table.
- **Junction tables:** every M2M uses a `(a_id, b_id)` unique index? Are PKs surrogate or composite?
- **Naming inconsistencies / duplications:** are there tables that should be merged or split? (e.g., scattered `*Names` tables vs. one polymorphic translations table — note the tradeoff, do not recommend changes lightly)
- **Type widths:** `varchar(N)` widths reasonable? `text` used where unbounded?
- **`onConflictDoNothing` in seed:** flag any seed insertion that silently swallows a real data mismatch
- **Drizzle relations:** check whether [database/schema.ts](database/schema.ts) declares the `relations()` needed for the joins in [app/models/pokeapi.server.ts](app/models/pokeapi.server.ts)

Output: `.claude/reviews/pokeapi-cache-audit/13-schema-design.md`

## Batch 14 — Synthesis (main thread, no subagent)

After all 13 batches have written their notes, the main thread does this directly (it only needs to read 13 markdown files, total well under context):

1. Read every `.claude/reviews/pokeapi-cache-audit/NN-*.md` file
2. Re-read the preservation list and confirm none of the drafted recommendations regress those items
3. Write `.claude/reviews/pokeapi-cache-audit/AUDIT_RECOMMENDATIONS.md`:
   - **Section A — Preservation contract** (custom additions that must not be removed)
   - **Section B — Schema additions** (new columns/tables for missing JSON fields, grouped by table, marked `[high|medium|low]`)
   - **Section C — Schema fixes** (best-practice issues: missing indexes, FK gaps, naming, etc.)
   - **Section D — Seed-script updates** (new field mappings, dropped-field handling, migration steps)
   - **Section E — Out of scope / decisions deferred** (things found but explicitly not recommended, with reason)
   - Each item: one sentence describing the change + file/line ref. Written so a follow-up Claude session can execute the list with minimal context-loading.
4. Write `.claude/reviews/pokeapi-cache-audit/AUDIT_COVERAGE.md` — per-table coverage matrix, one row per (endpoint, JSON field, status, target column).

## Critical files

- [database/schemas/pokeapi/](database/schemas/pokeapi/) — all 18 schema files
- [database/seeds/pokeapi/seed.ts](database/seeds/pokeapi/seed.ts) — seeding logic (2,587 lines)
- [database/schemas/pokeapi.ts](database/schemas/pokeapi.ts) — re-exports
- [app/models/pokeapi.server.ts](app/models/pokeapi.server.ts) — query patterns inform index recommendations
- [server-cache/pokeapi.co/api/v2/resources.json](server-cache/pokeapi.co/api/v2/resources.json) — authoritative endpoint list

## Preservation contract (must survive the audit)

- **`pokemonSpritesTable`** at [pokemon.ts:231-250](database/schemas/pokeapi/pokemon.ts#L231-L250) — application flattens nested sprites for UI; do not collapse back
- **`pokemonSpeciesEvolutionsTable.baseForm`** at [pokemon-species.ts:262](database/schemas/pokeapi/pokemon-species.ts#L262) — required by seed `collectEvolutions()` to disambiguate regional-form evolutions
- **`pokemonSpeciesEvolutionsTable.usedMoveId`** at [pokemon-species.ts:238](database/schemas/pokeapi/pokemon-species.ts#L238)
- **`pokemonSpeciesEvolutionsTable.evolveStartPokemonId` and `evolveEndPokemonId`** at [pokemon-species.ts:226, 231](database/schemas/pokeapi/pokemon-species.ts#L226) — implicit FKs to specific pokemon forms (not species)
- Any other custom column flagged by Batches 09–11 during execution

## Reusable artifacts (committed for future re-runs)

The first time we run this audit costs a lot of context. To make repeats cheap, Batch 14 also produces these reusable artifacts. All live inside the repo under `.claude/reviews/pokeapi-cache-audit/`:

### 1. `AUDIT_PROCESS.md` — the playbook

A self-contained doc that lets a future Claude session re-run the audit without re-deriving the strategy. Contents:

- One-paragraph goal statement
- Endpoint-group table (the 13 batches from this plan, with endpoint counts + schema-file mappings) — copy-paste ready for spinning up subagents
- The "Notes template" (verbatim from this plan)
- The "Universal batch instructions" (verbatim from this plan)
- File-selection heuristic ("for shape variety, prefer X, Y, Z kinds of entries")
- The Preservation contract — kept here so it lives next to the audit and stays in sync when schema columns change
- Pointer to the cached endpoint list at [server-cache/pokeapi.co/api/v2/resources.json](server-cache/pokeapi.co/api/v2/resources.json) and to the seed at [database/seeds/pokeapi/seed.ts](database/seeds/pokeapi/seed.ts)
- Trigger list for when to re-run: "after a major PokeAPI version bump", "after adding a new top-level table to `pokeapi` schema", "if seed coverage warnings appear in logs"

### 2. `_sample-files.json` — curated sample sets

A small JSON map: `{ endpointName: { reason: "...", files: ["1.json", "6.json", ...] } }` listing the 10 files Batch N chose for each endpoint, with the variety rationale. Two benefits:

- A re-run can either re-use the same samples (for apples-to-apples diff against the prior audit) or deliberately rotate to different ones to discover new field shapes
- Future contributors can see *why* those files were chosen — e.g., for `pokemon`: bulbasaur (basic), charizard (mega forms), pikachu (many forms), ditto (special), mewtwo, deoxys (multi-form), eternatus (DLC), plus a couple of `1000x.json` alternate-form entries

### 3. `AUDIT_RECOMMENDATIONS.md` and `AUDIT_COVERAGE.md` — durable outputs

Already covered above, but worth re-stating: these are the durable, machine-readable outputs the next audit will *diff against* rather than redo from scratch. A re-run that produces an identical coverage matrix means nothing has drifted and the work was cheap.

### 4. `00-overview.md` — status board

Written by the main thread before Batch 01 starts. Lists all 13 batches with checkboxes; each batch subagent ticks its box when it writes its notes file. Survives compaction — if the audit is interrupted, the next session reads this file and resumes from the first unchecked batch.

### 5. Plan archive

This plan file is copied to `.claude/plans/pokeapi-cache-audit.md` as part of the same commit, so the planning record lives with the audit outputs rather than only in `~/.claude/plans/`.

### What we intentionally do NOT add

- No new code (no helper scripts, no Drizzle changes) — keeps the audit a pure documentation pass and matches the "no implementation in this pass" rule
- No automation of the subagent dispatch (would require committing prompts; the playbook doc is enough)
- No changes to [.gitignore](.gitignore) — the existing rules don't touch `.claude/`, so the new files will be committed by default, which is what we want

## Verification

This plan produces documents, not code, so verification = readability + completeness checks:

1. After Batch 14, confirm `.claude/reviews/pokeapi-cache-audit/AUDIT_RECOMMENDATIONS.md` Section A enumerates every item in the Preservation contract above
2. Confirm `.claude/reviews/pokeapi-cache-audit/AUDIT_COVERAGE.md` has a row for every endpoint listed in [resources.json](server-cache/pokeapi.co/api/v2/resources.json) plus `pokemon-location-area`
3. Spot-check 2–3 batch notes against the actual JSON to make sure no obvious top-level field was missed (sample: `pokemon-species/1.json` should include `pal_park_encounters`, `varieties`, `form_descriptions` — confirm each appears in Batch 11's notes)
4. When the follow-up "execute the recommendations" session runs, it should be able to start with `cat .claude/reviews/pokeapi-cache-audit/AUDIT_RECOMMENDATIONS.md` and proceed without re-deriving any of the audit findings
5. A future re-run of the audit should be able to start with `cat .claude/reviews/pokeapi-cache-audit/AUDIT_PROCESS.md` and proceed without re-deriving the batch grouping or sample-file strategy
