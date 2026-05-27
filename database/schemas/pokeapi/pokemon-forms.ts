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
import { pokemonTable } from "./pokemon";
import { typesTable } from "./types";

const pokeApiSchema = pgSchema("pokeapi");

export const pokemonFormsTable = pokeApiSchema.table("pokemon_forms", {
  pokemonFormId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  formName: varchar({ length: 255 }).notNull(),
  formOrder: integer().notNull(),
  order: integer().notNull(),
  isDefault: boolean().notNull(),
  isBattleOnly: boolean().notNull(),
  isMega: boolean().notNull(),
  pokemonId: integer()
    .notNull()
    .references(() => pokemonTable.pokemonId),
  versionGroupId: integer()
    .notNull()
    .references(() => versionGroupsTable.versionGroupId),
  ...timestamps,
});

// `names` — translated display names for the whole form (e.g. "Zarbi B")
export const pokemonFormNamesTable = pokeApiSchema.table(
  "pokemon_form_names",
  {
    pokemonFormNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonFormId: integer()
      .notNull()
      .references(() => pokemonFormsTable.pokemonFormId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_form_names_form_id_lang_id_unique").on(
      table.pokemonFormId,
      table.localLanguageId,
    ),
  ],
);

// `form_names` — translated names for just the form suffix (e.g. "Ｂ")
export const pokemonFormFormNamesTable = pokeApiSchema.table(
  "pokemon_form_form_names",
  {
    pokemonFormFormNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonFormId: integer()
      .notNull()
      .references(() => pokemonFormsTable.pokemonFormId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_form_form_names_form_id_lang_id_unique").on(
      table.pokemonFormId,
      table.localLanguageId,
    ),
  ],
);

export const pokemonFormTypesTable = pokeApiSchema.table(
  "pokemon_form_types",
  {
    pokemonFormTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonFormId: integer()
      .notNull()
      .references(() => pokemonFormsTable.pokemonFormId),
    typeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    slot: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_form_types_form_id_slot_unique").on(
      table.pokemonFormId,
      table.slot,
    ),
  ],
);
