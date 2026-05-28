import {
  boolean,
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { generationsTable, versionGroupsTable } from "./generations";
import { languagesTable } from "./languages";

const pokeApiSchema = pgSchema("pokeapi");

export const abilitiesTable = pokeApiSchema.table("abilities", {
  abilityId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  isMainSeries: boolean().notNull(),
  generationId: integer().references(() => generationsTable.generationId),
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
  },
  (table) => [
    uniqueIndex("ability_flavor_texts_ab_id_lang_id_vg_id_unique").on(
      table.abilityId,
      table.localLanguageId,
      table.versionGroupId,
    ),
  ],
);

// History table for ability.effect_changes[]: per-version-group overrides
// to the effect/short_effect text. Ability effect_changes typically have no
// short_effect — allow nullable.
export const abilityEffectHistoryTable = pokeApiSchema.table(
  "ability_effect_history",
  {
    abilityEffectHistoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    abilityId: integer()
      .notNull()
      .references(() => abilitiesTable.abilityId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    shortEffect: text(),
  },
  (table) => [
    uniqueIndex("ability_effect_history_ab_id_vg_id_lang_id_unique").on(
      table.abilityId,
      table.versionGroupId,
      table.localLanguageId,
    ),
  ],
);
