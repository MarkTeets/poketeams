import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import {
  evolutionTriggersTable,
  generationsTable,
  versionsTable,
} from "./generations";
import { itemsTable } from "./items";
import { languagesTable } from "./languages";
import { movesTable } from "./moves";
import {
  eggGroupsTable,
  gendersTable,
  pokemonColorsTable,
  pokemonHabitatsTable,
  pokemonShapesTable,
} from "./pokemon-attributes";
import {
  growthRatesTable,
  locationsTable,
  palParkAreasTable,
  regionsTable,
} from "./regions";
import { typesTable } from "./types";

const pokeApiSchema = pgSchema("pokeapi");

// evolutionChainId is nullable here — backfilled after evolution_chains exists
export const pokemonSpeciesTable = pokeApiSchema.table(
  "pokemon_species",
  {
    pokemonSpeciesId: integer().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    url: varchar({ length: 500 }).notNull(),
    order: integer().notNull(),
    genderRate: integer().notNull(),
    captureRate: integer().notNull(),
    baseHappiness: integer(),
    isBaby: boolean().notNull(),
    isLegendary: boolean().notNull(),
    isMythical: boolean().notNull(),
    hatchCounter: integer(),
    hasGenderDifferences: boolean().notNull(),
    formsSwitchable: boolean().notNull(),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    growthRateId: integer()
      .notNull()
      .references(() => growthRatesTable.growthRateId),
    pokemonColorId: integer()
      .notNull()
      .references(() => pokemonColorsTable.pokemonColorId),
    pokemonShapeId: integer().references(
      () => pokemonShapesTable.pokemonShapeId,
    ),
    pokemonHabitatId: integer().references(
      () => pokemonHabitatsTable.pokemonHabitatId,
    ),
    evolvesFromSpeciesId: integer().references(
      (): AnyPgColumn => pokemonSpeciesTable.pokemonSpeciesId,
    ),
    evolutionChainId: integer().references(
      () => evolutionChainsTable.evolutionChainId,
    ),
  },
  (table) => [
    index("pokemon_species_evolves_from_species_id_idx").on(
      table.evolvesFromSpeciesId,
    ),
    index("pokemon_species_evolution_chain_id_idx").on(table.evolutionChainId),
  ],
);

export const pokemonSpeciesNamesTable = pokeApiSchema.table(
  "pokemon_species_names",
  {
    pokemonSpeciesNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_species_names_ps_id_lang_id_unique").on(
      table.pokemonSpeciesId,
      table.localLanguageId,
    ),
  ],
);

// flavor_text_entries on species use version (not version_group)
export const pokemonSpeciesFlavorTextsTable = pokeApiSchema.table(
  "pokemon_species_flavor_texts",
  {
    pokemonSpeciesFlavorTextId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    versionId: integer()
      .notNull()
      .references(() => versionsTable.versionId),
    flavorText: text().notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_species_flavor_texts_ps_id_lang_id_v_id_unique").on(
      table.pokemonSpeciesId,
      table.localLanguageId,
      table.versionId,
    ),
  ],
);

export const pokemonSpeciesGeneraTable = pokeApiSchema.table(
  "pokemon_species_genera",
  {
    pokemonSpeciesGenusId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    genus: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_species_genera_ps_id_lang_id_unique").on(
      table.pokemonSpeciesId,
      table.localLanguageId,
    ),
  ],
);

// i18n descriptions of forms for multi-form species (e.g. deoxys).
export const pokemonSpeciesFormDescriptionsTable = pokeApiSchema.table(
  "pokemon_species_form_descriptions",
  {
    pokemonSpeciesFormDescriptionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: text().notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_species_form_descriptions_ps_id_lang_id_unique").on(
      table.pokemonSpeciesId,
      table.localLanguageId,
    ),
  ],
);

export const pokemonSpeciesEggGroupsTable = pokeApiSchema.table(
  "pokemon_species_egg_groups",
  {
    pokemonSpeciesEggGroupId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    eggGroupId: integer()
      .notNull()
      .references(() => eggGroupsTable.eggGroupId),
  },
  (table) => [
    uniqueIndex("pokemon_species_egg_groups_ps_id_eg_id_unique").on(
      table.pokemonSpeciesId,
      table.eggGroupId,
    ),
  ],
);

export const pokemonSpeciesPalParkEncountersTable = pokeApiSchema.table(
  "pokemon_species_pal_park_encounters",
  {
    palParkEncounterId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    palParkAreaId: integer()
      .notNull()
      .references(() => palParkAreasTable.palParkAreaId),
    baseScore: integer().notNull(),
    rate: integer().notNull(),
  },
  (table) => [
    uniqueIndex("pal_park_encounters_ps_id_area_id_unique").on(
      table.pokemonSpeciesId,
      table.palParkAreaId,
    ),
  ],
);

// pokemon_species.evolutionChainId is backfilled after this table exists
export const evolutionChainsTable = pokeApiSchema.table("evolution_chains", {
  evolutionChainId: integer().primaryKey(),
  url: varchar({ length: 500 }).notNull(),
  babyTriggerItemId: integer().references(() => itemsTable.itemId),
});

export const pokemonSpeciesVarietiesTable = pokeApiSchema.table(
  "pokemon_species_varieties",
  {
    pokemonSpeciesVarietyId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    // Implicit FK to pokeapi.pokemon — no .references() to avoid circular import with pokemon.ts
    pokemonId: integer().notNull(),
    isDefault: boolean().notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_species_varieties_ps_id_p_id_unique").on(
      table.pokemonSpeciesId,
      table.pokemonId,
    ),
  ],
);

// Each row is one node in the evolution tree — trigger + conditions for how
// the species evolves FROM its parent (parent implied by pokemon_species.evolves_from_species_id)
export const pokemonSpeciesEvolutionsTable = pokeApiSchema.table(
  "pokemon_species_evolutions",
  {
    pokemonSpeciesEvolutionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    evolutionChainId: integer()
      .notNull()
      .references(() => evolutionChainsTable.evolutionChainId),
    evolveStartSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    // Implicit FK to pokeapi.pokemon — no .references() to avoid circular import with pokemon.ts
    evolveStartPokemonId: integer(),
    evolveEndSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    // Implicit FK to pokeapi.pokemon — no .references() to avoid circular import with pokemon.ts
    evolveEndPokemonId: integer(),
    triggerId: integer()
      .notNull()
      .references(() => evolutionTriggersTable.evolutionTriggerId),
    itemId: integer().references(() => itemsTable.itemId),
    heldItemId: integer().references(() => itemsTable.itemId),
    knownMoveId: integer().references(() => movesTable.moveId),
    usedMoveId: integer().references(() => movesTable.moveId),
    knownMoveTypeId: integer().references(() => typesTable.typeId),
    locationId: integer().references(() => locationsTable.locationId),
    partySpeciesId: integer().references(
      () => pokemonSpeciesTable.pokemonSpeciesId,
    ),
    partyTypeId: integer().references(() => typesTable.typeId),
    tradeSpeciesId: integer().references(
      () => pokemonSpeciesTable.pokemonSpeciesId,
    ),
    regionId: integer().references(() => regionsTable.regionId),
    genderId: integer().references(() => gendersTable.genderId),
    minLevel: integer(),
    minHappiness: integer(),
    minBeauty: integer(),
    minAffection: integer(),
    minDamageTaken: integer(),
    minMoveCount: integer(),
    minSteps: integer(),
    relativePhysicalStats: integer(),
    needsOverworldRain: boolean().notNull().default(false),
    needsMultiplayer: boolean().notNull().default(false),
    turnUpsideDown: boolean().notNull().default(false),
    timeOfDay: varchar({ length: 50 }),
    baseForm: varchar({ length: 255 }),
  },
  (table) => [
    index("pse_evolution_chain_id_idx").on(table.evolutionChainId),
    index("pse_evolve_start_species_id_idx").on(table.evolveStartSpeciesId),
    uniqueIndex("pse_chain_start_end_trigger_conditions_unique").on(
      table.evolutionChainId,
      table.evolveStartSpeciesId,
      table.evolveEndSpeciesId,
      table.triggerId,
      table.itemId,
      table.heldItemId,
      table.knownMoveId,
      table.usedMoveId,
      table.minLevel,
      table.timeOfDay,
      table.baseForm,
    ),
  ],
);
