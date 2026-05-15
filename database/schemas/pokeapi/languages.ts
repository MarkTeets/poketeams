import {
  boolean,
  integer,
  pgSchema,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";

const pokeApiSchema = pgSchema("pokeapi");

export const resourcesTable = pokeApiSchema.table("resources", {
  resourceId: integer().primaryKey().generatedAlwaysAsIdentity(),
  resource: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  hydratedAt: timestamp(),
  ...timestamps,
});

export const languagesTable = pokeApiSchema.table("languages", {
  languageId: integer().primaryKey(),
  iso3166: varchar({ length: 10 }).notNull(),
  iso639: varchar({ length: 10 }).notNull(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  official: boolean().notNull(),
  ...timestamps,
});

export const languageNamesTable = pokeApiSchema.table(
  "language_names",
  {
    languageNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    languageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("language_names_language_id_local_language_id_unique").on(
      table.languageId,
      table.localLanguageId,
    ),
  ],
);
