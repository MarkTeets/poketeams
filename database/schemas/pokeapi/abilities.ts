import {
  boolean,
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { generationsTable, versionGroupsTable } from "./generations";
import { languagesTable } from "./languages";

const pokeApiSchema = pgSchema("pokeapi");

export const abilitiesTable = pokeApiSchema.table("abilities", {
  abilityId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  isMainSeries: boolean().notNull(),
  generationId: integer().references(() => generationsTable.generationId),
  ...timestamps,
});

export const abilityNamesTable = pokeApiSchema.table(
  "ability_names",
  {
    abilityNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    abilityId: integer()
      .notNull()
      .references(() => abilitiesTable.abilityId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ability_names_ability_id_local_language_id_unique").on(
      table.abilityId,
      table.localLanguageId,
    ),
  ],
);

export const abilityEffectEntriesTable = pokeApiSchema.table(
  "ability_effect_entries",
  {
    abilityEffectEntryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    abilityId: integer()
      .notNull()
      .references(() => abilitiesTable.abilityId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    shortEffect: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ability_effect_entries_ab_id_lang_id_unique").on(
      table.abilityId,
      table.localLanguageId,
    ),
  ],
);

export const abilityFlavorTextsTable = pokeApiSchema.table(
  "ability_flavor_texts",
  {
    abilityFlavorTextId: integer().primaryKey().generatedAlwaysAsIdentity(),
    abilityId: integer()
      .notNull()
      .references(() => abilitiesTable.abilityId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    flavorText: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ability_flavor_texts_ab_id_lang_id_vg_id_unique").on(
      table.abilityId,
      table.localLanguageId,
      table.versionGroupId,
    ),
  ],
);
