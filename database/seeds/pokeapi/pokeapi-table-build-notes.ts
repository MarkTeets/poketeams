// Recommended build order (full — all resources).
// Goal: each resource's FK targets already exist when we get to it.
// "done" = tables already written; nullable = FK exists but column is nullable.
//
// Wave 0 — already done
//   language, move-ailment, move-battle-style, move-category
//
// Wave 1 — no deps beyond language
//   move-damage-class, stat, berry-firmness, pokeathlon-stat,
//   pokemon-color, pokemon-habitat, pokemon-shape,
//   encounter-method, evolution-trigger,
//   item-fling-effect, item-pocket, item-attribute,
//   egg-group, gender, move-learn-method, move-target,
//   super-contest-effect, contest-effect
//
// Wave 2 — depend on wave 1
//   contest-type   ⚠ build WITHOUT berry_flavor FK first (see berry-flavor note)
//   berry-flavor   → contest-type
//                  ⚠ circular: contest-type.berry_flavor → berry-flavor
//                    solution: build contest-type first (no FK column), build berry-flavor
//                    with FK to contest-type, then add nullable berry_flavor_id to
//                    contest-type and backfill in wave 8
//   region, pal-park-area, growth-rate
//
// Wave 3 — depend on wave 2
//   generation     → region (nullable)
//   encounter-condition
//
// Wave 4 — depend on wave 3
//   version        → generation
//   version-group  → generation, move-learn-method
//   encounter-condition-value → encounter-condition
//   characteristic → stat
//   type           → move-damage-class; generation (nullable)
//   nature         → stat, berry-flavor, pokeathlon-stat, move-battle-style (done)
//
// Wave 5 — depend on wave 4
//   item-category  → item-pocket
//   location       → region
//   ability        → generation (nullable)
//   move           → type, move-damage-class, move-category (done), move-ailment (done);
//                    generation (nullable)
//
// Wave 6 — depend on wave 5
//   item           → item-category; item-fling-effect (nullable)
//   berry          → berry-firmness, berry-flavor; item (nullable)
//   location-area  → location
//
// Wave 7 — depend on wave 6
//   machine        → item, move, version-group
//   pokemon-species → generation, egg-group, pokemon-color, pokemon-shape, growth-rate;
//                     pokemon-habitat (nullable); evolution-chain (nullable — circular)
//   evolution-chain ⚠ circular with pokemon-species
//                     solution: build pokemon-species with nullable evolution_chain_id,
//                     build evolution-chain with FK to pokemon-species, then backfill
//
// Wave 8 — depend on wave 7
//   pokemon        → pokemon-species, ability, type, stat, move, move-learn-method,
//                    version-group
//   pokedex        → version-group; region (nullable)
//   [backfill]  contest-type.berry_flavor_id → berry-flavor  (from wave 2 note)
//
// Wave 9 — depend on wave 8
//   pokemon-form   → pokemon, version-group, type

// Seed order — each table must be filled after all tables it references via FK.
//
// 1.  resources                              (no deps)
// 2.  languages                              (no deps)
// 3.  language_names                         (→ languages)
// 4.  move_ailments                          (no deps)
// 5.  move_ailment_names                     (→ move_ailments, languages)
// 6.  move_categories                        (no deps)
// 7.  move_category_descriptions             (→ move_categories, languages)
// 8.  move_battle_styles                     (no deps)
// 9.  move_battle_style_names                (→ move_battle_styles, languages)
// 10. move_damage_classes                    (no deps)
// 11. move_damage_class_names                (→ move_damage_classes, languages)
// 12. move_damage_class_descriptions         (→ move_damage_classes, languages)
// 13. stats                                  (→ move_damage_classes nullable)
// 14. stat_names                             (→ stats, languages)
// 15. berry_firmnesses                       (no deps)
// 16. berry_firmness_names                   (→ berry_firmnesses, languages)
// 17. pokeathlon_stats                       (no deps)
// 18. pokeathlon_stat_names                  (→ pokeathlon_stats, languages)
// 19. pokemon_colors                         (no deps)
// 20. pokemon_color_names                    (→ pokemon_colors, languages)
// 21. pokemon_habitats                       (no deps)
// 22. pokemon_habitat_names                  (→ pokemon_habitats, languages)
// 23. pokemon_shapes                         (no deps)
// 24. pokemon_shape_names                    (→ pokemon_shapes, languages)
// 25. pokemon_shape_awesome_names            (→ pokemon_shapes, languages)
// 26. encounter_methods                      (no deps)
// 27. encounter_method_names                 (→ encounter_methods, languages)
// 28. evolution_triggers                     (no deps)
// 29. evolution_trigger_names                (→ evolution_triggers, languages)
// 30. item_fling_effects                     (no deps)
// 31. item_fling_effect_effect_entries       (→ item_fling_effects, languages)
// 32. item_pockets                           (no deps)
// 33. item_pocket_names                      (→ item_pockets, languages)
// 34. item_attributes                        (no deps)
// 35. item_attribute_names                   (→ item_attributes, languages)
// 36. item_attribute_descriptions            (→ item_attributes, languages)
// 37. egg_groups                             (no deps)
// 38. egg_group_names                        (→ egg_groups, languages)
// 39. genders                                (no deps)
// 40. move_learn_methods                     (no deps)
// 41. move_learn_method_names                (→ move_learn_methods, languages)
// 42. move_learn_method_descriptions         (→ move_learn_methods, languages)
// 43. move_targets                           (no deps)
// 44. move_target_names                      (→ move_targets, languages)
// 45. move_target_descriptions               (→ move_targets, languages)
// 46. super_contest_effects                  (no deps)
// 47. super_contest_effect_flavor_texts      (→ super_contest_effects, languages)
// 48. contest_effects                        (no deps)
// 49. contest_effect_effect_entries          (→ contest_effects, languages)
// 50. contest_effect_flavor_texts            (→ contest_effects, languages)
// 51. contest_types                          (no deps — berryFlavorId added wave 8)
// 52. contest_type_names                     (→ contest_types, languages)
// 53. berry_flavors                          (→ contest_types)
// 54. berry_flavor_names                     (→ berry_flavors, languages)
// 55. regions                                (no deps)
// 56. region_names                           (→ regions, languages)
// 57. pal_park_areas                         (no deps)
// 58. pal_park_area_names                    (→ pal_park_areas, languages)
// 59. growth_rates                           (no deps)
// 60. growth_rate_descriptions               (→ growth_rates, languages)
// 61. generations                            (→ regions nullable)
// 62. generation_names                       (→ generations, languages)
// 63. encounter_conditions                   (no deps)
// 64. encounter_condition_names              (→ encounter_conditions, languages)
// 65. version_groups                         (→ generations)
// 66. version_group_move_learn_methods       (→ version_groups, move_learn_methods)
// 67. version_group_regions                  (→ version_groups, regions)
// 68. versions                               (→ version_groups)
// 69. version_names                          (→ versions, languages)
// 70. encounter_condition_values             (→ encounter_conditions)
// 71. encounter_condition_value_names        (→ encounter_condition_values, languages)
// 72. characteristics                        (→ stats)
// 73. characteristic_descriptions            (→ characteristics, languages)
// 74. types                                  (→ move_damage_classes; generations nullable)
// 75. type_names                             (→ types, languages)
// 76. type_efficacy                          (→ types × types)
// 77. type_game_indices                      (→ types, generations)
// 78. natures                                (→ stats ×2 nullable; berry_flavors ×2 nullable)
// 79. nature_names                           (→ natures, languages)
// 80. nature_pokeathlon_stat_changes         (→ natures, pokeathlon_stats)
// 81. nature_battle_style_preferences        (→ natures, move_battle_styles)
// 82. item_categories                        (→ item_pockets)
// 83. item_category_names                    (→ item_categories, languages)
// 84. locations                              (→ regions nullable)
// 85. location_names                         (→ locations, languages)
// 86. abilities                              (→ generations nullable)
// 87. ability_names                          (→ abilities, languages)
// 88. ability_effect_entries                 (→ abilities, languages)
// 89. ability_flavor_texts                   (→ abilities, languages, version_groups)
// 90. moves                                  (→ move_damage_classes, types, move_targets;
//                                              generations/contest_types/contest_effects/
//                                              super_contest_effects nullable)
// 91. move_names                             (→ moves, languages)
// 92. move_effect_entries                    (→ moves, languages)
// 93. move_flavor_texts                      (→ moves, languages, version_groups)
// 94. move_meta                              (→ moves, move_ailments, move_categories)
// 95. move_stat_changes                      (→ moves, stats)
// 96. items                                  (→ item_categories; item_fling_effects nullable)
// 97. item_names                             (→ items, languages)
// 98. item_effect_entries                    (→ items, languages)
// 99. item_flavor_texts                      (→ items, languages, version_groups)
// 100. item_item_attributes                  (→ items, item_attributes)
// 101. item_game_indices                     (→ items, generations)
// 102. berries                               (→ berry_firmnesses; items/types nullable)
// 103. berry_flavor_potencies                (→ berries, berry_flavors)
// 104. location_areas                        (→ locations)
// 105. location_area_names                   (→ location_areas, languages)
// 106. machines                              (→ items, moves, version_groups)
// 107. pokemon_species                       (→ generations, growth_rates, pokemon_colors,
//                                              pokemon_shapes; habitats/evolution_chain_id nullable)
// 108. pokemon_species_names                 (→ pokemon_species, languages)
// 109. pokemon_species_flavor_texts          (→ pokemon_species, languages, versions)
// 110. pokemon_species_genera                (→ pokemon_species, languages)
// 111. pokemon_species_egg_groups            (→ pokemon_species, egg_groups)
// 112. pokemon_species_pal_park_encounters   (→ pokemon_species, pal_park_areas)
// 113. evolution_chains                      (→ items nullable)
// 114. pokemon_species_evolutions            (→ evolution_chains, pokemon_species,
//                                              evolution_triggers; many nullable FKs)
// [backfill] pokemon_species.evolution_chain_id → evolution_chains
// 115. pokedexes                             (→ regions nullable)
// 116. pokedex_names                         (→ pokedexes, languages)
// 117. pokedex_descriptions                  (→ pokedexes, languages)
// 118. pokedex_version_groups                (→ pokedexes, version_groups)
// 119. pokemon_species_pokedex_numbers       (→ pokemon_species, pokedexes)
// 120. pokemon                               (→ pokemon_species)
// 121. pokemon_abilities                     (→ pokemon, abilities)
// 122. pokemon_types                         (→ pokemon, types)
// 123. pokemon_stats                         (→ pokemon, stats)
// 124. pokemon_moves                         (→ pokemon, moves, version_groups,
//                                              move_learn_methods)
// 125. pokemon_game_indices                  (→ pokemon, versions)
// 126. pokemon_held_items                    (→ pokemon, items, versions)
// 127. pokemon_past_types                    (→ pokemon, generations, types)
// 128. pokemon_past_abilities                (→ pokemon, generations, abilities)
// 129. pokemon_past_stats                    (→ pokemon, generations, stats)
// [backfill] contest_types.berry_flavor_id → berry_flavors
// 130. pokemon_forms                         (→ pokemon, version_groups)
// 131. pokemon_form_names                    (→ pokemon_forms, languages)
// 132. pokemon_form_form_names               (→ pokemon_forms, languages)
// 133. pokemon_form_types                    (→ pokemon_forms, types)

// PokeAPI resources — tables written?
//
// [x] language              → languages, language_names
// [x] ability               → abilities, ability_names, ability_effect_entries,
//                             ability_flavor_texts
// [x] berry                 → berries, berry_flavor_potencies
// [x] berry-firmness        → berry_firmnesses, berry_firmness_names
// [x] berry-flavor          → berry_flavors, berry_flavor_names
// [x] characteristic       → characteristics, characteristic_descriptions
// [x] contest-effect        → contest_effects, contest_effect_effect_entries,
//                             contest_effect_flavor_texts
// [x] contest-type          → contest_types, contest_type_names
//                             (berryFlavorId FK added wave 8)
// [x] egg-group             → egg_groups, egg_group_names
// [x] encounter-condition   → encounter_conditions, encounter_condition_names
// [x] encounter-condition-value → encounter_condition_values,
//                             encounter_condition_value_names
// [x] encounter-method      → encounter_methods, encounter_method_names
// [x] evolution-chain       → evolution_chains, pokemon_species_evolutions
// [x] evolution-trigger     → evolution_triggers, evolution_trigger_names
// [x] gender                → genders
// [x] generation            → generations, generation_names
// [x] growth-rate           → growth_rates, growth_rate_descriptions
// [x] item                  → items, item_names, item_effect_entries,
//                             item_flavor_texts, item_item_attributes,
//                             item_game_indices
// [x] item-attribute        → item_attributes, item_attribute_names,
//                             item_attribute_descriptions
// [x] item-category         → item_categories, item_category_names
// [x] item-fling-effect     → item_fling_effects, item_fling_effect_effect_entries
// [x] item-pocket           → item_pockets, item_pocket_names
// [x] location              → locations, location_names
// [x] location-area         → location_areas, location_area_names
// [x] machine               → machines
// [ ] meta
// [x] move                  → moves, move_names, move_effect_entries,
//                             move_flavor_texts, move_meta, move_stat_changes
// [x] move-ailment          → move_ailments, move_ailment_names
// [x] move-battle-style     → move_battle_styles, move_battle_style_names
// [x] move-category         → move_categories, move_category_descriptions
// [x] move-damage-class     → move_damage_classes, move_damage_class_names,
//                             move_damage_class_descriptions
// [x] move-learn-method     → move_learn_methods, move_learn_method_names,
//                             move_learn_method_descriptions
// [x] move-target           → move_targets, move_target_names,
//                             move_target_descriptions
// [x] nature                → natures, nature_names, nature_pokeathlon_stat_changes,
//                             nature_battle_style_preferences
// [x] pal-park-area         → pal_park_areas, pal_park_area_names
// [x] pokeathlon-stat       → pokeathlon_stats, pokeathlon_stat_names
// [x] pokedex               → pokedexes, pokedex_names, pokedex_descriptions,
//                             pokedex_version_groups
// [x] pokemon               → pokemon, pokemon_abilities, pokemon_types, pokemon_stats,
//                             pokemon_moves, pokemon_game_indices, pokemon_held_items,
//                             pokemon_past_types, pokemon_past_abilities, pokemon_past_stats
// [x] pokemon-color         → pokemon_colors, pokemon_color_names
// [x] pokemon-form          → pokemon_forms, pokemon_form_names,
//                             pokemon_form_form_names, pokemon_form_types
// [x] pokemon-habitat       → pokemon_habitats, pokemon_habitat_names
// [x] pokemon-shape         → pokemon_shapes, pokemon_shape_names,
//                             pokemon_shape_awesome_names
// [x] pokemon-species       → pokemon_species, pokemon_species_names,
//                             pokemon_species_flavor_texts, pokemon_species_genera,
//                             pokemon_species_egg_groups,
//                             pokemon_species_pal_park_encounters
// [x] region                → regions, region_names
// [x] stat                  → stats, stat_names
// [x] super-contest-effect  → super_contest_effects,
//                             super_contest_effect_flavor_texts
// [x] type                  → types, type_names, type_efficacy, type_game_indices
// [x] version               → versions, version_names
// [x] version-group         → version_groups, version_group_move_learn_methods,
//                             version_group_regions
