# 12 — Pokemon encounters (orphan check)
**Endpoints:** pokemon-location-area (1350 — sampled 10)
**Schema files touched:** none — this is an orphan endpoint with no current table

## pokemon-location-area

- Files sampled: 1.json (bulbasaur), 150.json (mewtwo), 386.json (deoxys), 890.json (eternatus — empty), 10001.json (alt-form — empty), plus size-only inspection of 16/19/41/60/132.json
- JSON top-level shape: each file is an **array** of `{location_area: {name, url}, version_details: [{version: {name, url}, max_chance: int, encounter_details: [{min_level, max_level, condition_values: [{name,url}], chance, method: {name,url}}]}]}`
- DB table: **NONE EXISTS** — this data has no destination
- Seed handling: no seed code touches this endpoint
- **Dropped JSON fields:** ALL of them. The 1350 cached files (~10 MB) are downloaded but never read.

### Where the data flows in the codebase

Grep results across `app/` and `database/` for `pokemon-location-area`, `pokemonLocationArea`, `location_area_encounters`:
- `database/seeds/pokeapi/constants.ts:61` — endpoint map declares it
- `database/seeds/pokeapi/downloadAll.ts:204-255` — `fetchPokemonLocationAreas` writes files to disk
- `database/seeds/pokeapi/validate.ts:264` — validates `pokemon` JSON contains a `location_area_encounters` URL (validates the parent's reference, not this sub-resource)

**Zero references in `seed.ts`. Zero references in `app/models/`.** The data is downloaded but never consumed.

This also confirms Batch 08's finding that `location-area.pokemon_encounters` is dropped — the exact same data, viewed from the location side, is also unpersisted.

## Preservation-list touches
None — orphan endpoint with no existing table.

## Recommendation

### (A) Add `wildEncountersTable` to encounters.ts — **recommended**

Schema already has all the lookup tables (`encounterMethodsTable`, `encounterConditionValuesTable`, `locationAreasTable`, `versionsTable`, `pokemonTable`) — only the fact table is missing.

Proposed shape:
```ts
wildEncountersTable {
  wildEncounterId: serial PK
  pokemonId: int FK pokemon
  locationAreaId: int FK location_areas
  versionId: int FK versions
  encounterMethodId: int FK encounter_methods
  minLevel: int
  maxLevel: int
  chance: int  // 0–100 individual encounter chance
}
wildEncounterConditionValuesTable {  // M2M: one encounter row × N condition values
  wildEncounterId: int FK wild_encounters
  encounterConditionValueId: int FK encounter_condition_values
  // composite PK or unique index on (wildEncounterId, encounterConditionValueId)
}
```

Design notes:
- **Surrogate PK** required: the same `(pokemonId, locationAreaId, versionId, encounterMethodId)` tuple repeats with different condition_value sets (e.g. morning vs night versions of an old-rod encounter).
- **Use `versionId` not `versionGroupId`** — the data is per-version not per-group.
- **Do NOT store `max_chance`** — it's a derived sum across the encounter_details for that location_area+version pair; recompute in queries.
- **Empty-array tolerance:** eternatus/890 and the alt-form 10001 files return empty arrays — seed must skip cleanly.
- **Source choice:** populate from `pokemon-location-area/{id}.json` (cleanest per-pokemon shape). Could also use `location-area/{id}.json.pokemon_encounters` but pokemon-side is simpler.

### Alternatives considered

- **(B) Document as out of scope:** acceptable if the app definitely won't need wild-encounter data. Currently the route `app/routes/$species-detail.tsx` doesn't show encounter info, so this is plausible — but two endpoints (location-area + pokemon-location-area) deliver the same data and both are downloaded, suggesting intent to use it.
- **(C) Lazy-load from API at query time:** inconsistent with the rest of the app's "cache then serve from DB" pattern.

**Recommend (A).** This single table addition closes both gaps (location-area drop AND pokemon-location-area orphan) and uses tables that already exist.

## Group-level observations

This is the **single biggest data gap in the audit**. ~10 MB of useful, downloaded data is being thrown away. A one-table addition resolves it.
