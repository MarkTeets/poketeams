import {
  boolean,
  integer,
  pgSchema,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { versionGroupsTable } from "./generations";
import { languagesTable } from "./languages";
import { pokemonSpeciesTable } from "./pokemon-species";
import { regionsTable } from "./regions";

const pokeApiSchema = pgSchema("pokeapi");

export const pokedexTable = pokeApiSchema.table("pokedexes", {
  pokedexId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  isMainSeries: boolean().notNull(),
  regionId: integer().references(() => regionsTable.regionId),
  ...timestamps,
});

export const pokedexNamesTable = pokeApiSchema.table(
  "pokedex_names",
  {
    pokedexNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokedexId: integer()
      .notNull()
      .references(() => pokedexTable.pokedexId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokedex_names_pokedex_id_lang_id_unique").on(
      table.pokedexId,
      table.localLanguageId,
    ),
  ],
);

export const pokedexDescriptionsTable = pokeApiSchema.table(
  "pokedex_descriptions",
  {
    pokedexDescriptionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokedexId: integer()
      .notNull()
      .references(() => pokedexTable.pokedexId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokedex_descriptions_pokedex_id_lang_id_unique").on(
      table.pokedexId,
      table.localLanguageId,
    ),
  ],
);

export const pokedexVersionGroupsTable = pokeApiSchema.table(
  "pokedex_version_groups",
  {
    pokedexVersionGroupId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokedexId: integer()
      .notNull()
      .references(() => pokedexTable.pokedexId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokedex_version_groups_pokedex_id_vg_id_unique").on(
      table.pokedexId,
      table.versionGroupId,
    ),
  ],
);

// pokemon_species_pokedex_numbers — sourced from pokedex.pokemon_entries[]
export const pokemonSpeciesPokedexNumbersTable = pokeApiSchema.table(
  "pokemon_species_pokedex_numbers",
  {
    pokemonSpeciesPokedexNumberId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    pokemonSpeciesId: integer()
      .notNull()
      .references(() => pokemonSpeciesTable.pokemonSpeciesId),
    pokedexId: integer()
      .notNull()
      .references(() => pokedexTable.pokedexId),
    entryNumber: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex(
      "pokemon_species_pokedex_numbers_species_id_pokedex_id_unique",
    ).on(table.pokemonSpeciesId, table.pokedexId),
  ],
);
