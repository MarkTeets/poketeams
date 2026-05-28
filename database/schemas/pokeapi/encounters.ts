import {
  integer,
  pgSchema,
  primaryKey,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { languagesTable } from "./languages";
import { versionsTable } from "./generations";
import { locationAreasTable } from "./regions";
import { pokemonTable } from "./pokemon";

const pokeApiSchema = pgSchema("pokeapi");

export const encounterMethodsTable = pokeApiSchema.table("encounter_methods", {
  encounterMethodId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  order: integer().notNull(),
});

export const encounterMethodNamesTable = pokeApiSchema.table(
  "encounter_method_names",
  {
    encounterMethodNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    encounterMethodId: integer()
      .notNull()
      .references(() => encounterMethodsTable.encounterMethodId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("encounter_method_names_em_id_local_language_id_unique").on(
      table.encounterMethodId,
      table.localLanguageId,
    ),
  ],
);

export const encounterConditionsTable = pokeApiSchema.table(
  "encounter_conditions",
  {
    encounterConditionId: integer().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    url: varchar({ length: 500 }).notNull(),
  },
);

export const encounterConditionNamesTable = pokeApiSchema.table(
  "encounter_condition_names",
  {
    encounterConditionNameId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    encounterConditionId: integer()
      .notNull()
      .references(() => encounterConditionsTable.encounterConditionId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("encounter_condition_names_ec_id_local_language_id_unique").on(
      table.encounterConditionId,
      table.localLanguageId,
    ),
  ],
);

export const encounterConditionValuesTable = pokeApiSchema.table(
  "encounter_condition_values",
  {
    encounterConditionValueId: integer().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    url: varchar({ length: 500 }).notNull(),
    encounterConditionId: integer()
      .notNull()
      .references(() => encounterConditionsTable.encounterConditionId),
  },
);

export const encounterConditionValueNamesTable = pokeApiSchema.table(
  "encounter_condition_value_names",
  {
    encounterConditionValueNameId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    encounterConditionValueId: integer()
      .notNull()
      .references(
        () => encounterConditionValuesTable.encounterConditionValueId,
      ),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("encounter_condition_value_names_ecv_id_lang_id_unique").on(
      table.encounterConditionValueId,
      table.localLanguageId,
    ),
  ],
);

// Source: pokemon-location-area/<pokemonId>.json — one row per (pokemon, locationArea, version, method, level-range, chance).
// Surrogate PK because the same tuple repeats with different condition_value sets.
export const wildEncountersTable = pokeApiSchema.table("wild_encounters", {
  wildEncounterId: integer().primaryKey().generatedAlwaysAsIdentity(),
  pokemonId: integer()
    .notNull()
    .references(() => pokemonTable.pokemonId),
  locationAreaId: integer()
    .notNull()
    .references(() => locationAreasTable.locationAreaId),
  versionId: integer()
    .notNull()
    .references(() => versionsTable.versionId),
  encounterMethodId: integer()
    .notNull()
    .references(() => encounterMethodsTable.encounterMethodId),
  minLevel: integer().notNull(),
  maxLevel: integer().notNull(),
  chance: integer().notNull(),
});

export const wildEncounterConditionValuesTable = pokeApiSchema.table(
  "wild_encounter_condition_values",
  {
    wildEncounterId: integer()
      .notNull()
      .references(() => wildEncountersTable.wildEncounterId),
    encounterConditionValueId: integer()
      .notNull()
      .references(
        () => encounterConditionValuesTable.encounterConditionValueId,
      ),
  },
  (table) => [
    primaryKey({
      columns: [table.wildEncounterId, table.encounterConditionValueId],
    }),
  ],
);
