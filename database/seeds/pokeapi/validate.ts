import { promises as fsPromises } from "fs";
import * as path from "path";

import { logger } from "../../utils/db-logger";
import { cacheBase } from "./constants";

/**
 * Top-level fields the seeder reads from each PokeAPI endpoint's cached JSON.
 * Both missing fields (PokeAPI removed something) and extra fields (PokeAPI added
 * something new) are treated as schema drift and cause {@link validate} to throw.
 * Update this map whenever the seeder starts reading a new field.
 */
const requiredFields: Record<string, string[]> = {
  language: ["id", "iso3166", "iso639", "name", "names", "official"],
  "move-ailment": ["id", "moves", "name", "names"],
  "move-battle-style": ["id", "name", "names"],
  "move-category": ["descriptions", "id", "moves", "name"],
  "move-damage-class": ["descriptions", "id", "moves", "name", "names"],
  stat: [
    "affecting_items",
    "affecting_moves",
    "affecting_natures",
    "characteristics",
    "game_index",
    "id",
    "is_battle_only",
    "move_damage_class",
    "name",
    "names",
  ],
  "berry-firmness": ["berries", "id", "name", "names"],
  "pokeathlon-stat": ["affecting_natures", "id", "name", "names"],
  "pokemon-color": ["id", "name", "names", "pokemon_species"],
  "pokemon-habitat": ["id", "name", "names", "pokemon_species"],
  "pokemon-shape": ["awesome_names", "id", "name", "names", "pokemon_species"],
  "encounter-method": ["id", "name", "names", "order"],
  "evolution-trigger": ["id", "name", "names", "pokemon_species"],
  "item-fling-effect": ["effect_entries", "id", "items", "name"],
  "item-pocket": ["categories", "id", "name", "names"],
  "item-attribute": ["descriptions", "id", "items", "name", "names"],
  "egg-group": ["id", "name", "names", "pokemon_species"],
  gender: ["id", "name", "pokemon_species_details", "required_for_evolution"],
  "move-learn-method": [
    "descriptions",
    "id",
    "name",
    "names",
    "version_groups",
  ],
  "move-target": ["descriptions", "id", "moves", "name", "names"],
  "super-contest-effect": ["appeal", "flavor_text_entries", "id", "moves"],
  "contest-effect": [
    "appeal",
    "effect_entries",
    "flavor_text_entries",
    "id",
    "jam",
  ],
  "contest-type": ["berry_flavor", "id", "name", "names"],
  "berry-flavor": ["berries", "contest_type", "id", "name", "names"],
  region: [
    "id",
    "locations",
    "main_generation",
    "name",
    "names",
    "pokedexes",
    "version_groups",
  ],
  "pal-park-area": ["id", "name", "names", "pokemon_encounters"],
  "growth-rate": [
    "descriptions",
    "formula",
    "id",
    "levels",
    "name",
    "pokemon_species",
  ],
  generation: [
    "abilities",
    "id",
    "main_region",
    "moves",
    "name",
    "names",
    "pokemon_species",
    "types",
    "version_groups",
  ],
  "encounter-condition": ["id", "name", "names", "values"],
  "version-group": [
    "generation",
    "id",
    "move_learn_methods",
    "name",
    "order",
    "pokedexes",
    "regions",
    "versions",
  ],
  version: ["id", "name", "names", "version_group"],
  "encounter-condition-value": ["condition", "id", "name", "names"],
  characteristic: [
    "descriptions",
    "gene_modulo",
    "highest_stat",
    "id",
    "possible_values",
  ],
  type: [
    "damage_relations",
    "game_indices",
    "generation",
    "id",
    "move_damage_class",
    "moves",
    "name",
    "names",
    "past_damage_relations",
    "pokemon",
    "sprites",
  ],
  nature: [
    "decreased_stat",
    "hates_flavor",
    "id",
    "increased_stat",
    "likes_flavor",
    "move_battle_style_preferences",
    "name",
    "names",
    "pokeathlon_stat_changes",
  ],
  "item-category": ["id", "items", "name", "names", "pocket"],
  location: ["areas", "game_indices", "id", "name", "names", "region"],
  ability: [
    "effect_changes",
    "effect_entries",
    "flavor_text_entries",
    "generation",
    "id",
    "is_main_series",
    "name",
    "names",
    "pokemon",
  ],
  move: [
    "accuracy",
    "contest_combos",
    "contest_effect",
    "contest_type",
    "damage_class",
    "effect_chance",
    "effect_changes",
    "effect_entries",
    "flavor_text_entries",
    "generation",
    "id",
    "learned_by_pokemon",
    "machines",
    "meta",
    "name",
    "names",
    "past_values",
    "power",
    "pp",
    "priority",
    "stat_changes",
    "super_contest_effect",
    "target",
    "type",
  ],
  item: [
    "attributes",
    "baby_trigger_for",
    "category",
    "cost",
    "effect_entries",
    "flavor_text_entries",
    "fling_effect",
    "fling_power",
    "game_indices",
    "held_by_pokemon",
    "id",
    "machines",
    "name",
    "names",
    "sprites",
  ],
  berry: [
    "firmness",
    "flavors",
    "growth_time",
    "id",
    "item",
    "max_harvest",
    "name",
    "natural_gift_power",
    "natural_gift_type",
    "size",
    "smoothness",
    "soil_dryness",
  ],
  "location-area": [
    "encounter_method_rates",
    "game_index",
    "id",
    "location",
    "name",
    "names",
    "pokemon_encounters",
  ],
  machine: ["id", "item", "move", "version_group"],
  "pokemon-species": [
    "base_happiness",
    "capture_rate",
    "color",
    "egg_groups",
    "evolution_chain",
    "evolves_from_species",
    "flavor_text_entries",
    "form_descriptions",
    "forms_switchable",
    "gender_rate",
    "genera",
    "generation",
    "growth_rate",
    "habitat",
    "has_gender_differences",
    "hatch_counter",
    "id",
    "is_baby",
    "is_legendary",
    "is_mythical",
    "name",
    "names",
    "order",
    "pal_park_encounters",
    "pokedex_numbers",
    "shape",
    "varieties",
  ],
  "evolution-chain": ["baby_trigger_item", "chain", "id"],
  pokedex: [
    "descriptions",
    "id",
    "is_main_series",
    "name",
    "names",
    "pokemon_entries",
    "region",
    "version_groups",
  ],
  pokemon: [
    "abilities",
    "base_experience",
    "cries",
    "forms",
    "game_indices",
    "height",
    "held_items",
    "id",
    "is_default",
    "location_area_encounters",
    "moves",
    "name",
    "order",
    "past_abilities",
    "past_stats",
    "past_types",
    "species",
    "sprites",
    "stats",
    "types",
    "weight",
  ],
  "pokemon-form": [
    "form_name",
    "form_names",
    "form_order",
    "id",
    "is_battle_only",
    "is_default",
    "is_mega",
    "name",
    "names",
    "order",
    "pokemon",
    "sprites",
    "types",
    "version_group",
  ],
};

/**
 * Reads up to `max` cached JSON files for an endpoint and returns their parsed contents.
 * Throws if the cache directory doesn't exist or contains no JSON files.
 *
 * @param endpoint - PokeAPI endpoint name, e.g. `"pokemon"` or `"move-ailment"`.
 * @param max - Maximum number of sample files to read (default 3).
 * @throws {Error} If the cache directory is missing or empty.
 */
async function readSampleFiles(
  endpoint: string,
  max = 3,
): Promise<Record<string, unknown>[]> {
  const dir = path.join(cacheBase, endpoint);
  let entries: string[];
  try {
    entries = await fsPromises.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      logger.warn(
        { endpoint },
        "Cache directory not found — run download first",
      );
      throw new Error(
        `Cache directory not found for endpoint "${endpoint}" — run download first`,
      );
    }
    throw err;
  }

  const jsonFiles = entries.filter((e) => e.endsWith(".json")).slice(0, max);
  if (jsonFiles.length === 0) {
    logger.warn({ endpoint }, "No JSON files found in cache directory");
    throw new Error(
      `No JSON files found for endpoint "${endpoint}" — run download first`,
    );
  }
  const results: Record<string, unknown>[] = [];
  for (const file of jsonFiles) {
    const content = await fsPromises.readFile(path.join(dir, file), "utf8");
    results.push(JSON.parse(content) as Record<string, unknown>);
  }
  return results;
}

/**
 * Asserts that `data` contains exactly the keys listed in `requiredFields` — no more, no fewer.
 *
 * @param data - Parsed JSON object from a cached resource file.
 * @param requiredFields - Expected top-level keys, sourced from {@link requiredFields}.
 * @param endpoint - Endpoint name, used in error messages.
 * @param fileHint - Human-readable label for the file being checked, used in error messages.
 * @throws {Error} If any required field is missing or any unrecognized field is present.
 */
function checkFields(
  data: Record<string, unknown>,
  requiredFields: string[],
  endpoint: string,
  fileHint: string,
): void {
  const presentKeys = new Set(Object.keys(data));
  for (const requiredField of requiredFields) {
    if (!presentKeys.has(requiredField)) {
      throw new Error(
        `Schema drift detected: endpoint "${endpoint}" file "${fileHint}" is missing required field "${requiredField}"`,
      );
    }
  }
  if (presentKeys.size !== requiredFields.length) {
    const requiredSet = new Set(requiredFields);
    const extra = [...presentKeys].filter((k) => !requiredSet.has(k));
    throw new Error(
      `Schema drift detected: endpoint "${endpoint}" file "${fileHint}" has new fields not in requiredFields: ${extra.join(", ")}`,
    );
  }
}

/**
 * Validates the local PokeAPI cache against {@link requiredFields}.
 * Samples up to 3 files per endpoint and checks each for exact field matches.
 *
 * @throws {Error} If any cache directory is missing, empty, or schema drift is detected.
 */
export async function validate(): Promise<void> {
  logger.info("Starting schema drift validation");
  const resourceList = Object.entries(requiredFields);

  for (const [endpoint, requiredFields] of resourceList) {
    const samples = await readSampleFiles(endpoint);

    for (const [i, sample] of samples.entries()) {
      checkFields(sample, requiredFields, endpoint, `sample[${i}]`);
    }
    logger.debug({ endpoint, samplesChecked: samples.length }, "Passed");
  }

  logger.info("Validation complete — all checked endpoints passed");
}

if (process.argv[1]?.endsWith("validate.ts")) {
  try {
    await validate();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Schema drift")) {
      logger.error(err.message);
    } else {
      logger.error({ err }, "Validation error");
    }
    process.exit(1);
  }
}
