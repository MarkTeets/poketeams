# 02 — Stats, characteristics, natures
**Endpoints:** stat (10 — all read), characteristic (31, 10 sampled: 1,2,6,10,11,15,20,25,28,30), nature (26, 10 sampled: 1,2,5,8,10,12,15,18,20,25)
**Schema files touched:** stats.ts, natures.ts

## stat

- Files sampled: 1.json–9.json (10 stat IDs 1–9 in cache; no `10.json` exists)
- JSON top-level fields:
  - `id` (int), `name` (string, e.g. "hp"/"attack"), `game_index` (int), `is_battle_only` (bool)
  - `move_damage_class` (object|null) — `{name, url}`
  - `names` (array[NamedResource]) — multilingual
  - `affecting_items` — array of items modifying stat (e.g. `{name: "hp-up", url}`)
  - `affecting_moves` — object `{increase: [...], decrease: [...]}` with move refs + `change` magnitude
  - `affecting_natures` — object `{increase: [...], decrease: [...]}` with nature refs
  - `characteristics` — array `[{url}]` refs to characteristics linked to this stat
- DB table: `statsTable` ([stats.ts:15-25](../../../database/schemas/pokeapi/stats.ts)), `statNamesTable`
- Persisted columns ↔ JSON: `id → statId`, `name → name (unique)`, `url → url`, `game_index → gameIndex`, `is_battle_only → isBattleOnly`, `move_damage_class.url → moveDamageClassId (FK)`; `names[]` → statNamesTable rows
- **Dropped JSON fields:**
  - `affecting_items` — **arguably useful** (HP Up, Power Bracer, etc. — game-mechanics UI)
  - `affecting_moves` with `change` magnitudes — **arguably useful** (damage calc, move finder)
  - `affecting_natures` (increase/decrease groups) — **reconstructable** via natures table (each nature already stores `decreased_stat_id`/`increased_stat_id`)
  - `characteristics` — **reconstructable** (characteristic has `highestStatId` FK back)
- **DB columns without JSON source (custom — preserve):** none beyond timestamps
- Seed handling: [seed.ts:408-417](../../../database/seeds/pokeapi/seed.ts) (statsTable) + [seed.ts:418-427](../../../database/seeds/pokeapi/seed.ts) (statNamesTable). No insertion of affecting_items, affecting_moves, or affecting_natures.
- Issues / questions: `affecting_moves[].change` magnitude (e.g., +1, +2, -1) is the only place this data exists if not reconstructed from individual move metadata.

## characteristic

- Files sampled: 1.json, 2.json, 6.json, 10.json, 11.json, 15.json, 20.json, 25.json, 28.json, 30.json
- JSON top-level fields: `id`, `gene_modulo` (int 0–4), `highest_stat` (`{name, url}`), `descriptions` (array of `{description, language}`), `possible_values` (array of int, e.g. `[0, 5, 10, 15, 20, 25, 30]`)
- DB table: `characteristicsTable` ([stats.ts:77-108](../../../database/schemas/pokeapi/stats.ts)), `characteristicDescriptionsTable`
- Persisted columns ↔ JSON: `id → characteristicId`, `highest_stat.url → highestStatId (FK)`, `gene_modulo → geneModulo`, `url → url`; descriptions flattened to characteristicDescriptionsTable
- **Dropped JSON fields:**
  - `possible_values` (array of ints) — **arguably useful** (modulo-dependent IV values; IV checker / generator)
- **DB columns without JSON source:** none
- Seed handling: [seed.ts:1181-1187](../../../database/seeds/pokeapi/seed.ts) (characteristicsTable) + [seed.ts:1189-1197](../../../database/seeds/pokeapi/seed.ts) (characteristicDescriptionsTable)
- Issues / questions: `possible_values` is a derived array (modulo from gene_modulo) but worth storing if the app needs IV displays.

## nature

- Files sampled: 1.json, 2.json, 5.json, 8.json, 10.json, 12.json, 15.json, 18.json, 20.json, 25.json
- JSON top-level fields:
  - `id`, `name` (string, e.g. "hardy"/"timid")
  - `decreased_stat` / `increased_stat` (`{name, url}` | null) — null only when neutral
  - `hates_flavor` / `likes_flavor` (`{name, url}` | null) — null for neutral natures
  - `names[]` — multilingual
  - `move_battle_style_preferences` — `[{move_battle_style, high_hp_preference, low_hp_preference}]`
  - `pokeathlon_stat_changes` — `[{pokeathlon_stat, max_change}]`
- DB tables: `naturesTable` ([natures.ts:11-20](../../../database/schemas/pokeapi/natures.ts)), `natureNamesTable`, `naturePokeathlonStatChangesTable`, `natureBattleStylePreferencesTable` ([natures.ts:43-88](../../../database/schemas/pokeapi/natures.ts))
- Persisted columns ↔ JSON: `id → natureId`, `name → name (unique)`, `url → url`, `decreased_stat.url → decreasedStatId (nullable FK)`, `increased_stat.url → increasedStatId`, `hates_flavor.url → hatesFlavorId`, `likes_flavor.url → likesFlavorId`; nested arrays fully flattened
- **Dropped JSON fields:** none — comprehensive mapping
- **DB columns without JSON source:** none
- Seed handling: [seed.ts:1302-1311](../../../database/seeds/pokeapi/seed.ts) (naturesTable) + [seed.ts:1313-1321](../../../database/seeds/pokeapi/seed.ts) (natureNamesTable) + [seed.ts:1323-1331](../../../database/seeds/pokeapi/seed.ts) (naturePokeathlonStatChangesTable) + [seed.ts:1333-1342](../../../database/seeds/pokeapi/seed.ts) (natureBattleStylePreferencesTable)
- Issues / questions: gold standard mapping — no gaps

## Preservation-list touches
None.

## Group-level observations

1. **Nature is the gold standard** for this audit — comprehensive flattening of all nested arrays.
2. **Stat endpoint has the most gaps** — `affecting_items`/`affecting_moves`/`affecting_natures` are all dropped; the first two are real data losses, the third is reconstructable.
3. **Characteristic's `possible_values`** is derivable but only via a runtime computation — would be cheap to store directly.
4. **Multilingual support is consistent** across all three endpoints (separate `*Names`/`*Descriptions` tables).
