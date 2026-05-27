# 06 — Items, berries, machines
**Endpoints:** item (2177 — sampled 10), item-category (55 — sampled 10), berry (65 — sampled 10), machine (2213 — sampled 10)
**Schema files touched:** items.ts, berries-and-contests.ts (berry part), machines.ts

## item

- Files sampled (variety set): master-ball/1, ultra-ball/2, potion/17, antidote/18, fire-stone/82, leaf-stone/85, exp-share/214, leftovers, oval-charm (key item), cheri-berry/126 (berry-as-item)
- JSON top-level fields:
  - `id`, `name`, `cost` (int), `fling_power` (int|null), `fling_effect` (`{name,url}|null`)
  - `attributes` (array of refs), `category` (`{name,url}`)
  - `effect_entries` (array of `{effect, short_effect, language}`)
  - `flavor_text_entries` (versioned, per language + version-group)
  - `game_indices` (per-generation IDs)
  - `names` (i18n)
  - `sprites` (object with `default` URL — single image)
  - `held_by_pokemon` (array of `{pokemon, version_details[]}`) — reverse-link
  - `baby_trigger_for` (`{url}|null`) — link to evolution-chain
  - `machines` (array of `{machine, version_group}`) — reverse-link
- DB tables: `itemsTable`, `itemNamesTable`, `itemEffectEntriesTable`, `itemAttributesTable` (join), `itemCategoriesTable` (parent), `itemFlingEffectsTable` (FK), `itemPocketsTable` (via category) ([items.ts](../../../database/schemas/pokeapi/items.ts))
- Persisted columns ↔ JSON: all scalar fields and FKs. Attributes flattened to junction table. Effects/flavor-texts/names to language tables. Game indices to itemGameIndicesTable.
- **Dropped JSON fields:**
  - `sprites.default` (single image URL) — **arguably useful**; pattern-wise inconsistent with `pokemonSpritesTable` (which preserves sprite URLs). A flat `itemSpriteUrl` column on itemsTable would be cheapest.
  - `held_by_pokemon` — **reconstructable** via pokemonHeldItemsTable
  - `baby_trigger_for` — **reconstructable** via evolutionChainsTable.babyTriggerItemId (already exists)
  - `machines` — **reconstructable** via machinesTable
- Seed handling: [seed.ts:1601-1687](../../../database/seeds/pokeapi/seed.ts) — transparent, no silent drops or transformations of persisted fields.

## item-category

- Files sampled: 1.json, 5.json, 20.json, 30.json, 50.json across mixed categories (medicine, balls, holdable, stones, etc.)
- JSON top-level fields: `id`, `name`, `items` (reverse), `names` (i18n), `pocket` (FK to item-pocket)
- DB table: `itemCategoriesTable` ([items.ts](../../../database/schemas/pokeapi/items.ts))
- Persisted ↔ JSON: 1:1 with item_pocket FK
- **Dropped:** `items` array — **reconstructable**
- Seed: standard

## berry

- Files sampled: cheri/1, chesto/2, oran/10, persim/12, leppa/14, lansat/35, starf/36 + several mid IDs
- JSON top-level fields: `id`, `name`, `firmness` (`{name,url}`), `flavors` (array of `{flavor: {name,url}, potency: int}`), `growth_time`, `max_harvest`, `natural_gift_power`, `natural_gift_type` (`{name,url}`), `size`, `smoothness`, `soil_dryness`, `item` (`{name,url}` link back to item)
- DB tables: `berriesTable`, `berryFlavorPotenciesTable` (junction with potency) ([berries-and-contests.ts](../../../database/schemas/pokeapi/berries-and-contests.ts))
- Persisted ↔ JSON: full coverage; `flavors[].potency` correctly preserved in junction
- **Dropped:** none material
- Seed: [seed.ts:1690-1733](../../../database/seeds/pokeapi/seed.ts) — clean

## machine

- Files sampled: 1.json, 100.json, 500.json, 1000.json, 1500.json, 2000.json + variety across version-groups (TMs/HMs in different gens)
- JSON top-level fields: `id`, `item` (`{name,url}`), `move` (`{name,url}`), `version_group` (`{name,url}`)
- DB table: `machinesTable` ([machines.ts](../../../database/schemas/pokeapi/machines.ts))
- Persisted ↔ JSON: 1:1 — minimal junction table
- **Dropped:** none
- Seed: [seed.ts:1772-1790](../../../database/seeds/pokeapi/seed.ts) — minimal

## Preservation-list touches
None.

## Group-level observations

1. **Item.sprites.default is an outlier** — every other endpoint with a sprite (pokemon, type) gets flagged for sprite handling. Items have ONE sprite URL but it's still dropped; trivial to add either as a column or in a unified sprite table.
2. **Berry endpoint is exemplary** — every nested array fully captured with relevant metadata (potency).
3. **Machine table is minimal and correct** — clean junction.
4. **Items endpoint has strong i18n** — names + effects + flavor texts all per language, and effects/flavor-texts split by language+version-group correctly.
