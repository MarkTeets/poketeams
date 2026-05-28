import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { languagesTable } from "./languages";

const pokeApiSchema = pgSchema("pokeapi");

export const pokemonColorsTable = pokeApiSchema.table("pokemon_colors", {
  pokemonColorId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const pokemonColorNamesTable = pokeApiSchema.table(
  "pokemon_color_names",
  {
    pokemonColorNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonColorId: integer()
      .notNull()
      .references(() => pokemonColorsTable.pokemonColorId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_color_names_pc_id_local_language_id_unique").on(
      table.pokemonColorId,
      table.localLanguageId,
    ),
  ],
);

export const pokemonHabitatsTable = pokeApiSchema.table("pokemon_habitats", {
  pokemonHabitatId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const pokemonHabitatNamesTable = pokeApiSchema.table(
  "pokemon_habitat_names",
  {
    pokemonHabitatNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonHabitatId: integer()
      .notNull()
      .references(() => pokemonHabitatsTable.pokemonHabitatId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_habitat_names_ph_id_local_language_id_unique").on(
      table.pokemonHabitatId,
      table.localLanguageId,
    ),
  ],
);

export const pokemonShapesTable = pokeApiSchema.table("pokemon_shapes", {
  pokemonShapeId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const pokemonShapeNamesTable = pokeApiSchema.table(
  "pokemon_shape_names",
  {
    pokemonShapeNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonShapeId: integer()
      .notNull()
      .references(() => pokemonShapesTable.pokemonShapeId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pokemon_shape_names_ps_id_local_language_id_unique").on(
      table.pokemonShapeId,
      table.localLanguageId,
    ),
  ],
);

export const pokemonShapeAwesomeNamesTable = pokeApiSchema.table(
  "pokemon_shape_awesome_names",
  {
    pokemonShapeAwesomeNameId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    pokemonShapeId: integer()
      .notNull()
      .references(() => pokemonShapesTable.pokemonShapeId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    awesomeName: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex(
      "pokemon_shape_awesome_names_ps_id_local_language_id_unique",
    ).on(table.pokemonShapeId, table.localLanguageId),
  ],
);

export const eggGroupsTable = pokeApiSchema.table("egg_groups", {
  eggGroupId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const eggGroupNamesTable = pokeApiSchema.table(
  "egg_group_names",
  {
    eggGroupNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    eggGroupId: integer()
      .notNull()
      .references(() => eggGroupsTable.eggGroupId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("egg_group_names_eg_id_local_language_id_unique").on(
      table.eggGroupId,
      table.localLanguageId,
    ),
  ],
);

export const gendersTable = pokeApiSchema.table("genders", {
  genderId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});
