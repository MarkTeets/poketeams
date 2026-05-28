import {
  boolean,
  integer,
  pgSchema,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const pokeApiSchema = pgSchema("pokeapi");

export const resourcesTable = pokeApiSchema.table("resources", {
  resourceId: integer().primaryKey().generatedAlwaysAsIdentity(),
  resource: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  hydratedAt: timestamp(),
});

export const languagesTable = pokeApiSchema.table("languages", {
  languageId: integer().primaryKey(),
  iso3166: varchar({ length: 10 }).notNull(),
  iso639: varchar({ length: 10 }).notNull(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  official: boolean().notNull(),
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
  },
  (table) => [
    uniqueIndex("language_names_language_id_local_language_id_unique").on(
      table.languageId,
      table.localLanguageId,
    ),
  ],
);
