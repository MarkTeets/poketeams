import {
  boolean,
  integer,
  pgSchema,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { languagesTable } from "./languages";
import { moveDamageClassesTable } from "./move-basics";

const pokeApiSchema = pgSchema("pokeapi");

export const statsTable = pokeApiSchema.table("stats", {
  statId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  gameIndex: integer().notNull(),
  isBattleOnly: boolean().notNull(),
  moveDamageClassId: integer().references(
    () => moveDamageClassesTable.moveDamageClassId,
  ),
});

export const statNamesTable = pokeApiSchema.table(
  "stat_names",
  {
    statNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    statId: integer()
      .notNull()
      .references(() => statsTable.statId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("stat_names_stat_id_local_language_id_unique").on(
      table.statId,
      table.localLanguageId,
    ),
  ],
);

export const pokeathlonStatsTable = pokeApiSchema.table("pokeathlon_stats", {
  pokeathlonStatId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const pokeathlonStatNamesTable = pokeApiSchema.table(
  "pokeathlon_stat_names",
  {
    pokeathlonStatNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokeathlonStatId: integer()
      .notNull()
      .references(() => pokeathlonStatsTable.pokeathlonStatId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pokeathlon_stat_names_ps_id_local_language_id_unique").on(
      table.pokeathlonStatId,
      table.localLanguageId,
    ),
  ],
);

// characteristic has no name — identified by highest_stat + gene_modulo
export const characteristicsTable = pokeApiSchema.table("characteristics", {
  characteristicId: integer().primaryKey(),
  url: varchar({ length: 500 }).notNull(),
  geneModulo: integer().notNull(),
  highestStatId: integer()
    .notNull()
    .references(() => statsTable.statId),
});

export const characteristicDescriptionsTable = pokeApiSchema.table(
  "characteristic_descriptions",
  {
    characteristicDescriptionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    characteristicId: integer()
      .notNull()
      .references(() => characteristicsTable.characteristicId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("characteristic_descriptions_char_id_lang_id_unique").on(
      table.characteristicId,
      table.localLanguageId,
    ),
  ],
);
