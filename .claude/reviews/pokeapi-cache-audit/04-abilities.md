# 04 — Abilities
**Endpoints:** ability (372 — sampled 10: 1, 9, 25, 65, 121, 152, 154, 281, and past_ability IDs 10001+)
**Schema files touched:** abilities.ts

## ability

- Files sampled: stench/1, static/9, wonder-guard/25, overgrow/65, multitype/121 (arceus-only), and additional gen-4+ abilities up to recent gens, plus past_ability IDs ≥10001
- JSON top-level fields:
  - `id`, `name`, `is_main_series` (bool), `generation` (`{name, url}`)
  - `names` (multilingual)
  - `effect_entries` (array of `{effect, short_effect, language}`) — **unversioned**
  - `flavor_text_entries` (array of `{flavor_text, language, version_group}`) — **versioned**
  - `effect_changes` (array of `{version_group, effect_entries}`) — historical effect rewrites
  - `pokemon` (array of `{is_hidden, slot, pokemon}` — pokemon that can have this ability)
- DB tables: `abilitiesTable`, `abilityNamesTable`, `abilityEffectEntriesTable`, `abilityFlavorTextsTable` ([abilities.ts](../../../database/schemas/pokeapi/abilities.ts))
- Persisted columns ↔ JSON: clean FKs via URL → ID resolution. `id`, `name (unique)`, `is_main_series`, `generation.url → generationId`. Names/effects/flavor-texts flattened to their respective tables with `(abilityId, localLanguageId)` and `(abilityId, localLanguageId, versionGroupId)` unique indexes.
- **Dropped JSON fields:**
  - `effect_changes` (historical ability rewrites by version-group) — **arguably useful** (e.g. Stench's Gen-5 mechanics change; would justify an `abilityEffectHistoryTable` if needed)
  - `pokemon` (reverse link, includes `is_hidden` and `slot`) — **reconstructable** via `pokemonAbilitiesTable` join
- **DB columns without JSON source (custom — preserve):** none beyond timestamps
- Seed handling: [seed.ts:1424-1467](../../../database/seeds/pokeapi/seed.ts) — straightforward flatmap inserts, no transformations.
- Issues / questions:
  - `effect_entries` (unversioned) vs `flavor_text_entries` (versioned) correctly recognized as different shapes — schema appropriately splits them.
  - Past_ability IDs (10001+) seeded as normal rows; no special flag/column needed.

## Preservation-list touches
None.

## Group-level observations

1. **Effect-vs-flavor split is exemplary** — schema correctly recognizes that effects change per generation but are language-only (no version-group), while flavor text changes per version-group per language. Other endpoints (e.g. moves) could be audited against this pattern.
2. **Past abilities (10001+ IDs) flow into the normal table** — relies on PokeAPI's convention of using IDs ≥10001 for variant entries. Document this.
3. **`effect_changes` dropping is a recurring gap** — same as type's `past_damage_relations`, pokemon's `past_*`. Suggests a common `*History` table convention.
