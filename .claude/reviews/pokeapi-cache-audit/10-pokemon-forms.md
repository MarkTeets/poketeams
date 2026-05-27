# 10 — Pokemon forms
**Endpoints:** pokemon-form (1579 — sampled 10)
**Schema files touched:** pokemon-forms.ts

## pokemon-form

- Files sampled: 1.json (bulbasaur), 25.json (pikachu), 10134.json (charizard-mega-x), 10365.json (charizard-gmax), 10193.json (rattata-alola), 10320.json (meowth-galar), 10407.json (zorua-hisui), 10419.json (tauros-paldea-combat-breed), 10195.json (raticate-totem-alola), 10357.json (zacian-crowned)
- JSON top-level fields: `id`, `name`, `order`, `form_order`, `is_default` (bool), `is_battle_only` (bool), `is_mega` (bool), `form_name` (string, often empty for default forms), `pokemon` (ref), `types[]`, `sprites` (object with nested versions), `form_names[]` (i18n), `names[]` (i18n), `version_group` (ref)
- DB tables: `pokemonFormsTable`, `pokemonFormNamesTable`, `pokemonFormFormNamesTable`, `pokemonFormTypesTable` ([pokemon-forms.ts](../../../database/schemas/pokeapi/pokemon-forms.ts))
- Persisted ↔ JSON: id, name, formIdentifier (from form_name), isBattleOnly, isMega, pokeApiId (from pokemon ref); types in junction; names + form_names in two separate i18n tables
- Seed handling: [seed.ts:2431-2445](../../../database/seeds/pokeapi/seed.ts) — the seed type doesn't even declare the `sprites` field
- **Dropped JSON fields:**
  - **`sprites` (whole object + nested `versions`)** — silently dropped. Note: largely recoverable via `pokemonSpritesTable` joined through the form's `pokemonId` (each alt form has its own pokemon row, e.g. charizard-mega-x = pokemon 10034). **Should document the redundancy in schema.** If form-specific sprites differ from the base pokemon's sprites, this would be a real loss.
  - `order`, `form_order` — scalar fields not persisted (form_order is the form's position within its species; useful for canonical display ordering)
- **DB columns without JSON source (custom — preserve):** none beyond timestamps
- Issues / questions:
  - **`is_default: true` for many non-canonical forms** (mega-x, gmax, alola, hisui, paldea, totem, crowned all had it). `is_default` is per-(pokemon, version_group), not "the canonical species form" — a foot-gun for model queries. Document this semantic.
  - **`form_name` is `notNull()` but empty string `""` for default forms** (bulbasaur, pikachu). Should be `nullable` or constrained.
  - **No index on `pokemonId` or `versionGroupId`** in `pokemonFormsTable` — common lookup paths.

## Preservation-list touches
- **`pokemonSpritesTable`** — indirectly relevant. Recommendation to leave form `sprites` unpersisted depends on Batch 09 confirming all 10000-range alt-form pokemon rows seed their sprites. Synthesis should cross-check.
- No new preserved columns found in pokemon-forms.ts.

## Group-level observations

1. **`is_default` semantic is risky** — it means "default for this (pokemon, version_group) pairing", not "canonical species form". App queries like "show me the default form for this species" need a different query.
2. **Form sprites: real or redundant?** If the cached `pokemon/10134.json` (charizard-mega-x) has its own sprites object identical to or different from `pokemon-form/10134.json`, that's the deciding factor. The schema bets on "redundant" — should be tested.
3. **`form_name` empty string** for default forms is fragile — consider `text NULL` instead of `varchar NOT NULL`.
4. **Missing indexes on FKs** is a recurring issue (see Batch 13 once it runs).
