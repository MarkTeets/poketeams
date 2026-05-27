# 05 — Moves
**Endpoints:** move (938 — sampled 10: pound/1, karate-chop/2, fire-punch/7, swords-dance/14, tackle/33, constrict/132, struggle/165, synthesis/235, volt-tackle/344, plus __list inspection for a z-move / max-move / gmax move)
**Schema files touched:** moves.ts

## move

- Files sampled: 1.json, 2.json, 7.json, 14.json, 33.json, 132.json, 165.json, 235.json, 344.json + recent gen sample
- JSON top-level fields (full inventory):
  - `id`, `name`, `accuracy` (int|null), `effect_chance` (int|null), `pp` (int|null), `priority` (int), `power` (int|null)
  - `contest_combos` (object|null with `normal.{use_before,use_after}` and `super.{use_before,use_after}`) — arrays of move refs
  - `contest_type` (`{name,url}|null`), `contest_effect` (`{url}|null`), `super_contest_effect` (`{url}|null`)
  - `damage_class` (`{name,url}`), `type` (`{name,url}`), `target` (`{name,url}`)
  - `generation` (`{name,url}`)
  - `meta` (object with `ailment`, `category`, `min_hits`, `max_hits`, `min_turns`, `max_turns`, `drain`, `healing`, `crit_rate`, `ailment_chance`, `flinch_chance`, `stat_chance`)
  - `effect_entries` (array of `{effect, short_effect, language}`)
  - `effect_changes` (array of `{version_group, effect_entries[]}`) — historical
  - `past_values` (array per version-group, snapshots of accuracy/effect_chance/power/pp/effect_entries/type)
  - `flavor_text_entries` (versioned)
  - `names` (i18n)
  - `learned_by_pokemon` (array of pokemon refs)
  - `machines` (array of `{machine, version_group}`)
  - `stat_changes` (array of `{change, stat}`)
- DB tables: `movesTable`, `moveNamesTable`, `moveEffectEntriesTable`, `moveFlavorTextsTable`, `moveMetaTable`, `moveStatChangesTable` ([moves.ts](../../../database/schemas/pokeapi/moves.ts))
- Persisted columns ↔ JSON: scalar fields + FKs (`damage_class`, `type`, `target`, `generation`, `contest_type`, `contest_effect`, `super_contest_effect`) on movesTable. `meta` flattened to moveMetaTable; `stat_changes` to moveStatChangesTable; names/effects/flavor-texts to their respective tables.
- **Dropped JSON fields:**
  - `contest_combos` (use_before/use_after move-to-move pairings) — **arguably useful**; would need a `moveContestCombosTable` with (move_id, paired_move_id, kind=normal|super, position=before|after)
  - `machines` (TM/HM links per version-group) — **reconstructable** from machinesTable (which has move + item + version_group); intentional reverse-link
  - `past_values` (per-version snapshots of power/pp/accuracy/effect_chance/effect_entries/type) — **arguably useful** historical data (e.g. struggle's effect_chance null→10 across gens; karate-chop's gold-silver null type)
  - `effect_changes` (historical effect text) — same pattern as abilities' effect_changes
  - `learned_by_pokemon` — **reconstructable** via `pokemonMovesTable`
- **DB columns without JSON source (custom — preserve):** none
- Seed handling: standard insert pattern. moveMetaTable normalizes the nested meta object; moveStatChangesTable handles M2M stat changes. No null-safety gaps.
- Issues / questions:
  - `past_values` is the most material drop — same pattern as type.past_damage_relations and ability.effect_changes. Strongly suggests a generic "history" table convention.
  - `contest_combos` is the only true reverse-relationship missing; if app ever shows contest planning, this matters.

## Preservation-list touches
None.

## Group-level observations

1. **Move schema is comprehensive** — only material drops are historical (`past_values`, `effect_changes`) and contest combos.
2. **Pattern emerging from Batches 03, 04, 05:** all three endpoints drop their `past_*`/`*_changes` historical arrays. A unified `*_history` table approach (per endpoint, with `(parent_id, version_group_id_or_generation_id, snapshot_json)`) would address all three at once if needed.
3. **Machines/learned_by_pokemon drops are intentional reverse-link patterns** — consistent with Batches 01–04.
