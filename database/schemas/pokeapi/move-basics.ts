import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { languagesTable } from "./languages";

const pokeApiSchema = pgSchema("pokeapi");

export const moveAilmentsTable = pokeApiSchema.table("move_ailments", {
  moveAilmentId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const moveAilmentNamesTable = pokeApiSchema.table(
  "move_ailment_names",
  {
    moveAilmentNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveAilmentId: integer()
      .notNull()
      .references(() => moveAilmentsTable.moveAilmentId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_ailment_names_ma_id_local_language_id_unique").on(
      table.moveAilmentId,
      table.localLanguageId,
    ),
  ],
);

export const moveCategoriesTable = pokeApiSchema.table("move_categories", {
  moveCategoryId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const moveCategoryDescriptionsTable = pokeApiSchema.table(
  "move_category_descriptions",
  {
    moveCategoryDescriptionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    moveCategoryId: integer()
      .notNull()
      .references(() => moveCategoriesTable.moveCategoryId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_category_descriptions_mc_id_local_language_id_unique").on(
      table.moveCategoryId,
      table.localLanguageId,
    ),
  ],
);

export const moveBattleStylesTable = pokeApiSchema.table("move_battle_styles", {
  moveBattleStyleId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const moveBattleStyleNamesTable = pokeApiSchema.table(
  "move_battle_style_names",
  {
    moveBattleStyleNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveBattleStyleId: integer()
      .notNull()
      .references(() => moveBattleStylesTable.moveBattleStyleId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_battle_style_names_mbs_id_local_language_id_unique").on(
      table.moveBattleStyleId,
      table.localLanguageId,
    ),
  ],
);

export const moveDamageClassesTable = pokeApiSchema.table(
  "move_damage_classes",
  {
    moveDamageClassId: integer().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    url: varchar({ length: 500 }).notNull(),
  },
);

export const moveDamageClassNamesTable = pokeApiSchema.table(
  "move_damage_class_names",
  {
    moveDamageClassNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveDamageClassId: integer()
      .notNull()
      .references(() => moveDamageClassesTable.moveDamageClassId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_damage_class_names_mdc_id_local_language_id_unique").on(
      table.moveDamageClassId,
      table.localLanguageId,
    ),
  ],
);

export const moveDamageClassDescriptionsTable = pokeApiSchema.table(
  "move_damage_class_descriptions",
  {
    moveDamageClassDescriptionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    moveDamageClassId: integer()
      .notNull()
      .references(() => moveDamageClassesTable.moveDamageClassId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_damage_class_descs_mdc_id_local_language_id_unique").on(
      table.moveDamageClassId,
      table.localLanguageId,
    ),
  ],
);

export const moveLearnMethodsTable = pokeApiSchema.table("move_learn_methods", {
  moveLearnMethodId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const moveLearnMethodNamesTable = pokeApiSchema.table(
  "move_learn_method_names",
  {
    moveLearnMethodNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveLearnMethodId: integer()
      .notNull()
      .references(() => moveLearnMethodsTable.moveLearnMethodId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_learn_method_names_mlm_id_local_language_id_unique").on(
      table.moveLearnMethodId,
      table.localLanguageId,
    ),
  ],
);

export const moveLearnMethodDescriptionsTable = pokeApiSchema.table(
  "move_learn_method_descriptions",
  {
    moveLearnMethodDescriptionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    moveLearnMethodId: integer()
      .notNull()
      .references(() => moveLearnMethodsTable.moveLearnMethodId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_learn_method_descs_mlm_id_local_language_id_unique").on(
      table.moveLearnMethodId,
      table.localLanguageId,
    ),
  ],
);

export const moveTargetsTable = pokeApiSchema.table("move_targets", {
  moveTargetId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const moveTargetNamesTable = pokeApiSchema.table(
  "move_target_names",
  {
    moveTargetNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveTargetId: integer()
      .notNull()
      .references(() => moveTargetsTable.moveTargetId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_target_names_mt_id_local_language_id_unique").on(
      table.moveTargetId,
      table.localLanguageId,
    ),
  ],
);

export const moveTargetDescriptionsTable = pokeApiSchema.table(
  "move_target_descriptions",
  {
    moveTargetDescriptionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    moveTargetId: integer()
      .notNull()
      .references(() => moveTargetsTable.moveTargetId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("move_target_descs_mt_id_local_language_id_unique").on(
      table.moveTargetId,
      table.localLanguageId,
    ),
  ],
);
