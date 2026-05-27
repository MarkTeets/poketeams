import {
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

export const itemFlingEffectsTable = pokeApiSchema.table("item_fling_effects", {
  itemFlingEffectId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const itemFlingEffectEffectEntriesTable = pokeApiSchema.table(
  "item_fling_effect_effect_entries",
  {
    itemFlingEffectEffectEntryId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    itemFlingEffectId: integer()
      .notNull()
      .references(() => itemFlingEffectsTable.itemFlingEffectId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_fling_effect_effects_ife_id_local_language_id_unique").on(
      table.itemFlingEffectId,
      table.localLanguageId,
    ),
  ],
);

export const itemPocketsTable = pokeApiSchema.table("item_pockets", {
  itemPocketId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const itemPocketNamesTable = pokeApiSchema.table(
  "item_pocket_names",
  {
    itemPocketNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemPocketId: integer()
      .notNull()
      .references(() => itemPocketsTable.itemPocketId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_pocket_names_ip_id_local_language_id_unique").on(
      table.itemPocketId,
      table.localLanguageId,
    ),
  ],
);

export const itemAttributesTable = pokeApiSchema.table("item_attributes", {
  itemAttributeId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const itemAttributeNamesTable = pokeApiSchema.table(
  "item_attribute_names",
  {
    itemAttributeNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemAttributeId: integer()
      .notNull()
      .references(() => itemAttributesTable.itemAttributeId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_attribute_names_ia_id_local_language_id_unique").on(
      table.itemAttributeId,
      table.localLanguageId,
    ),
  ],
);

export const itemAttributeDescriptionsTable = pokeApiSchema.table(
  "item_attribute_descriptions",
  {
    itemAttributeDescriptionId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    itemAttributeId: integer()
      .notNull()
      .references(() => itemAttributesTable.itemAttributeId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_attribute_descs_ia_id_local_language_id_unique").on(
      table.itemAttributeId,
      table.localLanguageId,
    ),
  ],
);

export const itemCategoriesTable = pokeApiSchema.table("item_categories", {
  itemCategoryId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  itemPocketId: integer()
    .notNull()
    .references(() => itemPocketsTable.itemPocketId),
  ...timestamps,
});

export const itemCategoryNamesTable = pokeApiSchema.table(
  "item_category_names",
  {
    itemCategoryNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemCategoryId: integer()
      .notNull()
      .references(() => itemCategoriesTable.itemCategoryId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_category_names_ic_id_local_language_id_unique").on(
      table.itemCategoryId,
      table.localLanguageId,
    ),
  ],
);

export const itemsTable = pokeApiSchema.table("items", {
  itemId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  cost: integer().notNull(),
  flingPower: integer(),
  itemCategoryId: integer()
    .notNull()
    .references(() => itemCategoriesTable.itemCategoryId),
  itemFlingEffectId: integer().references(
    () => itemFlingEffectsTable.itemFlingEffectId,
  ),
  ...timestamps,
});

export const itemNamesTable = pokeApiSchema.table(
  "item_names",
  {
    itemNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemId: integer()
      .notNull()
      .references(() => itemsTable.itemId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_names_item_id_local_language_id_unique").on(
      table.itemId,
      table.localLanguageId,
    ),
  ],
);

export const itemEffectEntriesTable = pokeApiSchema.table(
  "item_effect_entries",
  {
    itemEffectEntryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemId: integer()
      .notNull()
      .references(() => itemsTable.itemId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    shortEffect: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_effect_entries_item_id_lang_id_unique").on(
      table.itemId,
      table.localLanguageId,
    ),
  ],
);

// API uses "text" (not "flavor_text") for item flavor text entries
export const itemFlavorTextsTable = pokeApiSchema.table(
  "item_flavor_texts",
  {
    itemFlavorTextId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemId: integer()
      .notNull()
      .references(() => itemsTable.itemId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    text: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_flavor_texts_item_id_lang_id_vg_id_unique").on(
      table.itemId,
      table.localLanguageId,
      table.versionGroupId,
    ),
  ],
);

export const itemItemAttributesTable = pokeApiSchema.table(
  "item_item_attributes",
  {
    itemItemAttributeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemId: integer()
      .notNull()
      .references(() => itemsTable.itemId),
    itemAttributeId: integer()
      .notNull()
      .references(() => itemAttributesTable.itemAttributeId),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_item_attributes_item_id_attr_id_unique").on(
      table.itemId,
      table.itemAttributeId,
    ),
  ],
);

export const itemGameIndicesTable = pokeApiSchema.table(
  "item_game_indices",
  {
    itemGameIndexId: integer().primaryKey().generatedAlwaysAsIdentity(),
    itemId: integer()
      .notNull()
      .references(() => itemsTable.itemId),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    gameIndex: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("item_game_indices_item_id_generation_id_unique").on(
      table.itemId,
      table.generationId,
    ),
  ],
);
