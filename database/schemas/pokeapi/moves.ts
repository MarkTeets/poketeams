import {
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import {
  contestEffectsTable,
  contestTypesTable,
  superContestEffectsTable,
} from "./berries-and-contests";
import { generationsTable, versionGroupsTable } from "./generations";
import { languagesTable } from "./languages";
import {
  moveAilmentsTable,
  moveCategoriesTable,
  moveDamageClassesTable,
  moveTargetsTable,
} from "./move-basics";
import { statsTable } from "./stats";
import { typesTable } from "./types";

const pokeApiSchema = pgSchema("pokeapi");

export const movesTable = pokeApiSchema.table("moves", {
  moveId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  accuracy: integer(),
  effectChance: integer(),
  pp: integer(),
  priority: integer().notNull(),
  power: integer(),
  moveDamageClassId: integer()
    .notNull()
    .references(() => moveDamageClassesTable.moveDamageClassId),
  typeId: integer()
    .notNull()
    .references(() => typesTable.typeId),
  moveTargetId: integer()
    .notNull()
    .references(() => moveTargetsTable.moveTargetId),
  generationId: integer().references(() => generationsTable.generationId),
  contestTypeId: integer().references(() => contestTypesTable.contestTypeId),
  contestEffectId: integer().references(
    () => contestEffectsTable.contestEffectId,
  ),
  superContestEffectId: integer().references(
    () => superContestEffectsTable.superContestEffectId,
  ),
  ...timestamps,
});

export const moveNamesTable = pokeApiSchema.table(
  "move_names",
  {
    moveNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("move_names_move_id_local_language_id_unique").on(
      table.moveId,
      table.localLanguageId,
    ),
  ],
);

export const moveEffectEntriesTable = pokeApiSchema.table(
  "move_effect_entries",
  {
    moveEffectEntryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    shortEffect: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("move_effect_entries_move_id_lang_id_unique").on(
      table.moveId,
      table.localLanguageId,
    ),
  ],
);

export const moveFlavorTextsTable = pokeApiSchema.table(
  "move_flavor_texts",
  {
    moveFlavorTextId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
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
    uniqueIndex("move_flavor_texts_move_id_lang_id_vg_id_unique").on(
      table.moveId,
      table.localLanguageId,
      table.versionGroupId,
    ),
  ],
);

// 1:1 with moves — inlined here rather than in the moves table to keep it manageable
export const moveMetaTable = pokeApiSchema.table("move_meta", {
  moveMetaId: integer().primaryKey().generatedAlwaysAsIdentity(),
  moveId: integer()
    .notNull()
    .unique()
    .references(() => movesTable.moveId),
  moveAilmentId: integer()
    .notNull()
    .references(() => moveAilmentsTable.moveAilmentId),
  moveCategoryId: integer()
    .notNull()
    .references(() => moveCategoriesTable.moveCategoryId),
  minHits: integer(),
  maxHits: integer(),
  minTurns: integer(),
  maxTurns: integer(),
  drain: integer().notNull(),
  healing: integer().notNull(),
  critRate: integer().notNull(),
  ailmentChance: integer().notNull(),
  flinchChance: integer().notNull(),
  statChance: integer().notNull(),
  ...timestamps,
});

export const moveStatChangesTable = pokeApiSchema.table(
  "move_stat_changes",
  {
    moveStatChangeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    statId: integer()
      .notNull()
      .references(() => statsTable.statId),
    change: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("move_stat_changes_move_id_stat_id_unique").on(
      table.moveId,
      table.statId,
    ),
  ],
);
