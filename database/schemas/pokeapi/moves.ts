import {
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

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
  url: varchar({ length: 500 }).notNull(),
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
  },
  (table) => [
    uniqueIndex("move_stat_changes_move_id_stat_id_unique").on(
      table.moveId,
      table.statId,
    ),
  ],
);

// History table for move.past_values[]: per-version-group scalar overrides.
// All scalar fields nullable — past_values entries selectively override only
// the fields that actually changed in that version group.
export const moveValueHistoryTable = pokeApiSchema.table(
  "move_value_history",
  {
    moveValueHistoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    accuracy: integer(),
    effectChance: integer(),
    power: integer(),
    pp: integer(),
    typeId: integer().references(() => typesTable.typeId),
  },
  (table) => [
    uniqueIndex("move_value_history_move_id_vg_id_unique").on(
      table.moveId,
      table.versionGroupId,
    ),
  ],
);

// effect_entries nested under each past_values entry.
export const moveValueHistoryEffectEntriesTable = pokeApiSchema.table(
  "move_value_history_effect_entries",
  {
    moveValueHistoryEffectEntryId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    moveValueHistoryId: integer()
      .notNull()
      .references(() => moveValueHistoryTable.moveValueHistoryId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    shortEffect: text(),
  },
  (table) => [
    uniqueIndex("move_value_history_effect_entries_mvh_id_lang_id_unique").on(
      table.moveValueHistoryId,
      table.localLanguageId,
    ),
  ],
);

// History table for move.effect_changes[]: per-version-group effect text overrides.
export const moveEffectHistoryTable = pokeApiSchema.table(
  "move_effect_history",
  {
    moveEffectHistoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
  },
  (table) => [
    uniqueIndex("move_effect_history_move_id_vg_id_lang_id_unique").on(
      table.moveId,
      table.versionGroupId,
      table.localLanguageId,
    ),
  ],
);

// move.contest_combos.{normal,super}.{use_before,use_after}[]
// kind ∈ {"normal","super"}, position ∈ {"before","after"}.
export const moveContestCombosTable = pokeApiSchema.table(
  "move_contest_combos",
  {
    moveContestComboId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    pairedMoveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    kind: varchar({ length: 10 }).notNull(),
    position: varchar({ length: 10 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_contest_combos_move_paired_kind_position_unique").on(
      table.moveId,
      table.pairedMoveId,
      table.kind,
      table.position,
    ),
  ],
);
