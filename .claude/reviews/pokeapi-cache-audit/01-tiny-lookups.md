# 01 — Tiny lookups / reference data
**Endpoints:** language (14), generation (10), version (50), version-group (33), gender (4), growth-rate (7), pokemon-color (11), pokemon-shape (15), pokemon-habitat (10), egg-group (16), evolution-trigger (17), move-damage-class (4), move-battle-style (4), move-target (17), move-category (15), move-learn-method (12), move-ailment (23), item-pocket (9), item-attribute (9), item-fling-effect (8), pal-park-area (6), pokeathlon-stat (6), contest-type (6), berry-firmness (6), berry-flavor (6), encounter-condition (20), encounter-condition-value (10 sampled), encounter-method (10 sampled)
**Schema files touched:** languages.ts, generations.ts, pokemon-attributes.ts, regions.ts, encounters.ts, move-basics.ts, items.ts (partial), berries-and-contests.ts (partial), stats.ts (partial)

## Most surprising gaps

1. **Gender endpoint** — JSON has no `names` array. Only ID, name, and a massive `pokemon_species_details` array (1000+ entries per gender). **Critical data loss**: per-species gender rates discarded; only the base gender record exists. Cannot reconstruct pokemon gender distributions without re-fetching individual pokemon-species entries (where it lives as `gender_rate`).

2. **Growth-rate endpoint** — `levels` array (100 entries with experience thresholds per level) is **completely dropped**. Not even hinted at in schema. Important for EXP/level mechanics.

3. **Generation** — drops `abilities`, `moves`, `pokemon_species`, `types`, `version_groups` arrays entirely (5 major lists). These are reverse-lookups available from the other side, but convenience refs are gone.

4. **Item-pocket** — `categories` array (25+ item categories per pocket) stored as array of refs, not persisted.

5. **Pokeathlon-stat** — `affecting_natures` (with `increase`/`decrease`/`max_change`) reconstructable via natures table but not directly persisted.

6. **Berry-flavor** — `berries` array (with `potency`) is reconstructable via berry_flavor_potencies table.

## Per-endpoint mappings and seed handling

### languages
- Seed: [seed.ts:264-284](../../../database/seeds/pokeapi/seed.ts) — 1:1 + join for names. ✓ comprehensive
- JSON fields: `id`, `name`, `official`, `iso639`, `iso3166`, `names[]`
- All persisted

### generations
- Seed: [seed.ts:1019-1038](../../../database/seeds/pokeapi/seed.ts) — only id/name/mainRegionId + join for names; arrays dropped
- Dropped: `abilities`, `moves`, `pokemon_species`, `types`, `version_groups` (all reconstructable, but convenience refs missing)

### version
- Seed: [seed.ts:1111+](../../../database/seeds/pokeapi/seed.ts) — extracts versionGroupId from JSON
- Version-group ref is buried in JSON not a separate field — seed extracts it manually

### version-group
- Standard mapping; covers `generation`, `move_learn_methods`, `pokedexes`, `regions`, `versions`

### gender
- Seed: [seed.ts:729-737](../../../database/seeds/pokeapi/seed.ts) — only id/name; **pokemon_species_details completely ignored**
- **CRITICAL DROP:** the only place `male_percentage` info would come from (besides pokemon-species.gender_rate)

### growth-rate
- Seed: [seed.ts:985-1004](../../../database/seeds/pokeapi/seed.ts) — only id/name/formula + descriptions join; **levels array unused**
- **IMPORTANT DROP:** 100-row EXP table dropped per growth rate. Useful for EXP calculator.

### pokemon-color / pokemon-shape / pokemon-habitat
- Seed: [seed.ts:483-522](../../../database/seeds/pokeapi/seed.ts) — name+id+names-join pattern
- `pokemon_species` reverse-link array dropped (reconstructable from pokemon-species side)

### egg-group
- Standard name+id+names-join
- `pokemon_species` array dropped (reconstructable)

### evolution-trigger
- Standard name+id+names-join
- `pokemon_species` array dropped (reconstructable)

### move-damage-class / move-battle-style / move-category / move-learn-method / move-ailment / move-target
- Seed: [seed.ts:363-400+](../../../database/seeds/pokeapi/seed.ts) — id/name + name-join + description-join (where applicable)
- All `moves` reverse-links dropped (reconstructable)

### item-pocket
- Standard mapping
- **`categories` array dropped** — convenience link to all item categories in that pocket

### item-attribute
- Standard id/name + name-join + description-join
- `items` reverse-link dropped (reconstructable)

### item-fling-effect
- Has `effect_entries` (i18n effect text) + `items` reverse-link
- Standard mapping; items array dropped

### pal-park-area
- Standard mapping; `pokemon_encounters` array dropped (links to species)

### pokeathlon-stat
- Standard name+id+names-join
- **`affecting_natures.{increase,decrease}[{max_change,nature}]` dropped on this side** (exists on nature side via naturePokeathlonStatChanges)

### contest-type
- Seed: [seed.ts:877-902](../../../database/seeds/pokeapi/seed.ts) — id/name + names join
- Contest-type `names` includes an extra `color` field (per-language color name) — seed handles this correctly at [line 898](../../../database/seeds/pokeapi/seed.ts)
- `berry_flavor` ref persisted

### berry-firmness
- Standard mapping; `berries` array dropped (reconstructable from berry.firmness FK)

### berry-flavor
- Seed: [seed.ts:912-932](../../../database/seeds/pokeapi/seed.ts) — id/name/contestTypeId + names-join
- `berries` array with potency reconstructable via berry_flavor_potencies (covered in Batch 06)

### encounter-condition
- Seed: [seed.ts:1044-1063](../../../database/seeds/pokeapi/seed.ts) — simple name/id + names-join + values reverse-link

### encounter-condition-value
- Seed: [seed.ts:1148-1168](../../../database/seeds/pokeapi/seed.ts) — id/name/conditionId + names-join

### encounter-method
- Seed: [seed.ts:569-589](../../../database/seeds/pokeapi/seed.ts) — id/name/order + names-join

## Preservation-list touches
None in this batch.

## Group-level observations

1. **Pattern consistency:** all small lookup tables follow `id/name/url + *Names join` consistently. Naming is uniform.
2. **Reverse-link drops are pervasive** — most "what uses this X" arrays are dropped. This is fine since they're reconstructable, but worth documenting as an explicit policy in seed.ts comments.
3. **Two critical data losses warrant explicit decisions:**
   - `gender.pokemon_species_details` — gender rate per species (use `pokemon_species.gender_rate` instead?)
   - `growth-rate.levels` — full EXP table; no alternative source in this dataset
4. **`contest-type.names[].color`** is a non-standard extra field on the names array; seed handles correctly but worth a comment in schema.
