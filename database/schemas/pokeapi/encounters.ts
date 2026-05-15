import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { languagesTable } from "./languages";

const pokeApiSchema = pgSchema("pokeapi");

export const encounterMethodsTable = pokeApiSchema.table("encounter_methods", {
  encounterMethodId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  order: integer().notNull(),
  ...timestamps,
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
    ...timestamps,
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
    url: varchar({ length: 255 }).notNull(),
    ...timestamps,
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
    ...timestamps,
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
    url: varchar({ length: 255 }).notNull(),
    encounterConditionId: integer()
      .notNull()
      .references(() => encounterConditionsTable.encounterConditionId),
    ...timestamps,
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
    ...timestamps,
  },
  (table) => [
    uniqueIndex("encounter_condition_value_names_ecv_id_lang_id_unique").on(
      table.encounterConditionValueId,
      table.localLanguageId,
    ),
  ],
);
