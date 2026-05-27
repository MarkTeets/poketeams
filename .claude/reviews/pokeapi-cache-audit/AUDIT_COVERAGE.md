# PokeAPI Coverage Matrix

Per-endpoint summary of JSON-field → DB-column coverage. Status legend:
- ✓ **persisted** — clean 1:1 mapping or junction table
- ⚠ **dropped** — JSON field exists but not stored anywhere
- ↺ **reconstructable** — dropped here, but the same data lives elsewhere in the schema (junction reverse-link, etc.)
- 🔒 **custom** — preserved schema addition (no JSON source or special mapping)

Source: batch notes [01-tiny-lookups.md](01-tiny-lookups.md) through [13-schema-design.md](13-schema-design.md).

---

## Reference lookups (Batch 01)

| Endpoint | JSON field | Status | Target |
|---|---|---|---|
| language | id, name, official, iso639, iso3166 | ✓ | languagesTable |
| language | names[] | ✓ | languageNamesTable |
| generation | id, name | ✓ | generationsTable |
| generation | main_region | ✓ | generationsTable.mainRegionId |
| generation | names[] | ✓ | generationNamesTable |
| generation | abilities, moves, pokemon_species, types, version_groups | ↺ | reverse-link via FKs on the other side |
| version | id, name, version_group | ✓ | versionsTable |
| version | names[] | ✓ | versionNamesTable |
| version-group | id, name, order, generation, move_learn_methods, pokedexes, regions, versions | ✓ | versionGroupsTable + junction tables |
| **gender** | id, name | ✓ | gendersTable |
| **gender** | pokemon_species_details[] (per-species rate) | ⚠ | same data as `pokemon_species.gender_rate` (which IS persisted ✓) — see Recommendations §E |
| **growth-rate** | id, name, formula | ✓ | growthRatesTable |
| **growth-rate** | descriptions[] | ✓ | growthRateDescriptionsTable |
| **growth-rate** | levels[] (100 rows) | ⚠ | **gap — see Recommendations §B** |
| **growth-rate** | pokemon_species[] | ↺ | reverse via pokemonSpecies.growthRateId |
| pokemon-color/shape/habitat | id, name, names[] | ✓ | pokemon{Colors,Shapes,Habitats}Table + names |
| pokemon-color/shape/habitat | pokemon_species[] | ↺ | reverse |
| egg-group | id, name, names[] | ✓ | eggGroupsTable + names |
| egg-group | pokemon_species[] | ↺ | reverse |
| evolution-trigger | id, name, names[] | ✓ | evolutionTriggersTable + names |
| evolution-trigger | pokemon_species[] | ↺ | reverse |
| move-damage-class | id, name, descriptions[], names[] | ✓ | moveDamageClassesTable + names + descriptions |
| move-damage-class | moves[] | ↺ | reverse |
| move-battle-style/category/learn-method/ailment/target | id, name, descriptions[], names[] | ✓ | corresponding tables |
| **item-pocket** | id, name, names[] | ✓ | itemPocketsTable + names |
| **item-pocket** | categories[] | ⚠ | reconstructable via itemCategoriesTable.pocketId (which exists), so ↺ |
| item-attribute / item-fling-effect | scalar + names + descriptions | ✓ | corresponding tables |
| pal-park-area | id, name, names[] | ✓ | palParkAreasTable + names |
| pal-park-area | pokemon_encounters[] | ↺ | via pokemonSpeciesPalParkEncountersTable |
| pokeathlon-stat | id, name, names[] | ✓ | pokeathlonStatsTable + names |
| pokeathlon-stat | affecting_natures.{increase,decrease}[] | ↺ | via naturePokeathlonStatChangesTable |
| contest-type | id, name, berry_flavor, names[] (incl. extra `color`) | ✓ | contestTypesTable + names |
| berry-firmness | id, name, names[], berries[] | ✓ (berries↺) | berryFirmnessesTable + names |
| berry-flavor | id, name, contest_type, names[], berries[] | ✓ (berries↺ via berryFlavorPotencies) | berryFlavorsTable + names |
| encounter-condition | id, name, names[], values[] | ✓ | encounterConditionsTable + names; values reverse |
| encounter-condition-value | id, name, condition, names[] | ✓ | encounterConditionValuesTable + names |
| encounter-method | id, name, order, names[] | ✓ | encounterMethodsTable + names |

---

## Stats / characteristics / natures (Batch 02)

| Endpoint | JSON field | Status | Target |
|---|---|---|---|
| stat | id, name, game_index, is_battle_only, move_damage_class | ✓ | statsTable |
| stat | names[] | ✓ | statNamesTable |
| stat | **affecting_items[]** | ⚠ | gap |
| stat | **affecting_moves.{increase,decrease}[].change** | ⚠ | gap |
| stat | affecting_natures.{increase,decrease}[] | ↺ | via natures.{increased,decreased}StatId |
| stat | characteristics[] | ↺ | via characteristic.highestStatId |
| characteristic | id, gene_modulo, highest_stat, descriptions[] | ✓ | characteristicsTable + descriptions |
| characteristic | **possible_values[]** | ⚠ | derivable from gene_modulo; trivial gap |
| nature | id, name, decreased/increased_stat, hates/likes_flavor | ✓ | naturesTable |
| nature | names[] | ✓ | natureNamesTable |
| nature | move_battle_style_preferences[] | ✓ | natureBattleStylePreferencesTable |
| nature | pokeathlon_stat_changes[] | ✓ | naturePokeathlonStatChangesTable |

---

## Types (Batch 03)

| JSON field | Status | Target |
|---|---|---|
| id, name, generation, move_damage_class | ✓ | typesTable |
| names[] | ✓ | typeNamesTable |
| damage_relations (6 sub-arrays) | ✓ | typeEfficacyTable |
| **past_damage_relations[]** | ⚠ | historical type-chart changes; gap (see Recommendations §E) |
| game_indices[] | ✓ | typeGameIndicesTable |
| pokemon[] | ↺ | reverse via pokemonTypesTable |
| moves[] | ↺ | reverse via movesTable.typeId |
| **sprites (type icons)** | ⚠ | dropped; only needed for type-badge UI |

---

## Abilities (Batch 04)

| JSON field | Status | Target |
|---|---|---|
| id, name, is_main_series, generation | ✓ | abilitiesTable |
| names[] | ✓ | abilityNamesTable |
| effect_entries[] | ✓ | abilityEffectEntriesTable |
| flavor_text_entries[] (versioned) | ✓ | abilityFlavorTextsTable |
| **effect_changes[]** (historical) | ⚠ | gap |
| pokemon[] | ↺ | reverse via pokemonAbilitiesTable |

---

## Moves (Batch 05)

| JSON field | Status | Target |
|---|---|---|
| id, name, accuracy, effect_chance, pp, priority, power | ✓ | movesTable |
| damage_class, type, target, generation, contest_type, contest_effect, super_contest_effect | ✓ | movesTable FKs |
| meta (object) | ✓ | moveMetaTable |
| stat_changes[] | ✓ | moveStatChangesTable |
| names[], effect_entries[], flavor_text_entries[] | ✓ | corresponding tables |
| **contest_combos** (normal/super × before/after) | ⚠ | gap (see Recommendations §B low) |
| **past_values[]** (historical) | ⚠ | gap |
| **effect_changes[]** (historical) | ⚠ | gap |
| machines[] | ↺ | reverse via machinesTable |
| learned_by_pokemon[] | ↺ | reverse via pokemonMovesTable |

---

## Items / berries / machines (Batch 06)

| Endpoint | JSON field | Status | Target |
|---|---|---|---|
| item | id, name, cost, fling_power, fling_effect, category | ✓ | itemsTable |
| item | attributes[] | ✓ | itemAttributesTable junction |
| item | effect_entries[], flavor_text_entries[], names[], game_indices[] | ✓ | corresponding tables |
| item | **sprites.default** | ⚠ | gap (see Recommendations §B medium) |
| item | held_by_pokemon | ↺ | via pokemonHeldItemsTable |
| item | baby_trigger_for | ↺ | via evolutionChainsTable.babyTriggerItemId |
| item | machines | ↺ | via machinesTable |
| item-category | id, name, names[], pocket | ✓ | itemCategoriesTable |
| item-category | items[] | ↺ | reverse |
| berry | id, name, firmness, growth_time, max_harvest, natural_gift_power, natural_gift_type, size, smoothness, soil_dryness, item | ✓ | berriesTable |
| berry | flavors[] (with potency) | ✓ | berryFlavorPotenciesTable |
| machine | id, item, move, version_group | ✓ | machinesTable |

---

## Contests (Batch 07)

| Endpoint | JSON field | Status | Target |
|---|---|---|---|
| contest-effect | id, appeal, jam, effect_entries[], flavor_text_entries[] | ✓ | contestEffectsTable + EffectEntries + FlavorTexts |
| super-contest-effect | id, appeal, flavor_text_entries[] | ✓ | superContestEffectsTable + FlavorTexts |
| super-contest-effect | moves[] | ↺ | via movesTable.superContestEffectId |

---

## Regions / locations / pokedex (Batch 08)

| Endpoint | JSON field | Status | Target |
|---|---|---|---|
| region | id, name, names[] | ✓ | regionsTable + names |
| region | **main_generation** | ⚠ | gap (see Recommendations §B low) |
| region | **version_groups[]** | ⚠ | gap (see Recommendations §B low) |
| region | locations[], pokedexes[] | ↺ | reverse |
| location | id, name, region, names[] | ✓ | locationsTable + names |
| location | **game_indices[]** | ⚠ | gap (see Recommendations §B low) |
| location | areas[] | ↺ | reverse via locationAreasTable.locationId |
| location-area | id, name, game_index, location, names[] | ✓ | locationAreasTable + names |
| **location-area** | **encounter_method_rates[]** | ⚠ | **CRITICAL gap — see Recommendations §B high** |
| **location-area** | **pokemon_encounters[]** | ⚠ | **CRITICAL gap — see Recommendations §B high** |
| pokedex | id, name, is_main_series, region, descriptions[], names[], version_groups[], pokemon_entries[] | ✓ | pokedex + 4 junction tables |

---

## Pokemon core (Batch 09)

| JSON field | Status | Target |
|---|---|---|
| id, name, base_experience, height, weight, order, is_default | ✓ | pokemonTable |
| species | ✓ | pokemonTable.pokemonSpeciesId FK |
| cries.{latest, legacy} | 🔒 | pokemonTable.cryLatest/cryLegacy (flat columns, intentional) |
| abilities[] | ✓ | pokemonAbilitiesTable |
| types[] | ✓ | pokemonTypesTable |
| stats[] | ✓ | pokemonStatsTable |
| moves[] (per move × version_group × learn_method) | ✓ | pokemonMovesTable |
| game_indices[] | ✓ | pokemonGameIndicesTable |
| held_items[] (per version) | ✓ | pokemonHeldItemsTable |
| past_types[] | ✓ | pokemonPastTypesTable |
| past_abilities[] | ✓ | pokemonPastAbilitiesTable |
| past_stats[] | ✓ | pokemonPastStatsTable |
| **sprites (deeply nested)** | 🔒 | **pokemonSpritesTable — PRESERVE** |
| forms[] | ↺ | via pokemonFormsTable.pokeApiId |
| location_area_encounters | — | URL pointer; covered by Batch 12 orphan |

---

## Pokemon forms (Batch 10)

| JSON field | Status | Target |
|---|---|---|
| id, name, is_default, is_battle_only, is_mega, form_name | ✓ | pokemonFormsTable |
| pokemon (ref) | ✓ | pokemonFormsTable.pokeApiId |
| types[] | ✓ | pokemonFormTypesTable |
| names[], form_names[] | ✓ | pokemonFormNamesTable + pokemonFormFormNamesTable |
| version_group | ✓ | (column on forms table or in junction) |
| **sprites (object + nested versions)** | ⚠ | dropped at form level (covered redundantly by pokemonSpritesTable via the form's own pokemon row, e.g. charizard-mega-x = pokemon 10034) |
| **order, form_order** | ⚠ | scalar fields not persisted; form_order useful for canonical display ordering |

---

## Pokemon species + evolution (Batch 11)

### pokemon-species

| JSON field | Status | Target |
|---|---|---|
| id, name, order, gender_rate, capture_rate, base_happiness, is_baby, is_legendary, is_mythical, hatch_counter, has_gender_differences, forms_switchable | ✓ | pokemonSpeciesTable |
| generation, growth_rate, color, shape, habitat, evolves_from_species, evolution_chain | ✓ | FKs (note: evolves_from + evolution_chain lack `.references()` — see Recommendations §C) |
| names[] | ✓ | pokemonSpeciesNamesTable |
| flavor_text_entries[] (versioned by version, not version_group) | ✓ | pokemonSpeciesFlavorTextsTable |
| genera[] | ✓ | pokemonSpeciesGeneraTable |
| egg_groups[] | ✓ | pokemonSpeciesEggGroupsTable |
| pal_park_encounters[] | ✓ | pokemonSpeciesPalParkEncountersTable |
| pokedex_numbers[] | ✓ | pokemonSpeciesPokedexNumbersTable (seeded by pokedex seeder, not species seeder) |
| varieties[] | ✓ | pokemonSpeciesVarietiesTable (seeded by `seedPokemonSpeciesVarieties` after pokemon) |
| **form_descriptions[]** | ⚠ | gap (see Recommendations §B medium) |

### evolution-chain

| JSON field | Status | Target |
|---|---|---|
| id, url | ✓ | evolutionChainsTable |
| baby_trigger_item | ✓ | evolutionChainsTable.babyTriggerItemId |
| chain.species (recursive walk) | ✓ | computed evolveStart/EndSpeciesId in pokemonSpeciesEvolutionsTable |
| evolution_details.trigger | ✓ | triggerId |
| evolution_details.item, held_item | ✓ | itemId, heldItemId |
| evolution_details.known_move, known_move_type | ✓ | knownMoveId, knownMoveTypeId |
| **evolution_details.used_move** | 🔒 | **usedMoveId — PRESERVE** |
| evolution_details.location, party_species, party_type, trade_species, region, gender | ✓ | corresponding columns |
| evolution_details.min_{level,happiness,beauty,affection,damage_taken,move_count,steps} | ✓ | corresponding min* columns |
| evolution_details.time_of_day, relative_physical_stats | ✓ | timeOfDay, relativePhysicalStats |
| evolution_details.needs_overworld_rain, needs_multiplayer, turn_upside_down | ✓ | boolean columns |
| **evolution_details.base_form** | 🔒 | **baseForm — PRESERVE** (used for regional-form disambiguation) |
| chain → computed evolveStartPokemonId, evolveEndPokemonId | 🔒 | **PRESERVE** (resolved via pokemonNameMap from species.varieties) |

---

## Pokemon encounters (Batch 12 — orphan)

| Endpoint | JSON field | Status | Target |
|---|---|---|---|
| **pokemon-location-area** | entire array (1350 files, ~10 MB) | ⚠ | **ZERO consumption — no table exists. See Recommendations §B high** |

---

## Coverage summary

- **Persisted (✓):** the majority — ~85% of all JSON fields across 49 endpoints
- **Reconstructable (↺):** ~10% — mostly reverse-link arrays
- **Custom additions (🔒):** 5 items, all in the preservation contract
- **Real gaps (⚠):** ~15 items, of which:
  - **2 critical (high):** location-area encounter data + pokemon-location-area orphan (closed by one new table — see Recommendations §B)
  - **3 medium:** form_descriptions, growth-rate levels, item sprites
  - **~10 low:** misc per-endpoint scalars and arrays, plus all "historical" arrays (past_values, effect_changes, past_damage_relations) which are deferred unless feature need arises
