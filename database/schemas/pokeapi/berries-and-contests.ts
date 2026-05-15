import {
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { itemsTable } from "./items";
import { languagesTable } from "./languages";
import { typesTable } from "./types";

const pokeApiSchema = pgSchema("pokeapi");

export const berryFirmnessesTable = pokeApiSchema.table("berry_firmnesses", {
  berryFirmnessId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const berryFirmnessNamesTable = pokeApiSchema.table(
  "berry_firmness_names",
  {
    berryFirmnessNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    berryFirmnessId: integer()
      .notNull()
      .references(() => berryFirmnessesTable.berryFirmnessId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("berry_firmness_names_bf_id_local_language_id_unique").on(
      table.berryFirmnessId,
      table.localLanguageId,
    ),
  ],
);

export const superContestEffectsTable = pokeApiSchema.table(
  "super_contest_effects",
  {
    superContestEffectId: integer().primaryKey(),
    appeal: integer().notNull(),
    url: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
);

export const superContestEffectFlavorTextsTable = pokeApiSchema.table(
  "super_contest_effect_flavor_texts",
  {
    superContestEffectFlavorTextId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    superContestEffectId: integer()
      .notNull()
      .references(() => superContestEffectsTable.superContestEffectId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    flavorText: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("super_contest_effect_flavor_texts_sce_id_lang_id_unique").on(
      table.superContestEffectId,
      table.localLanguageId,
    ),
  ],
);

export const contestEffectsTable = pokeApiSchema.table("contest_effects", {
  contestEffectId: integer().primaryKey(),
  appeal: integer().notNull(),
  jam: integer().notNull(),
  url: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const contestEffectEffectEntriesTable = pokeApiSchema.table(
  "contest_effect_effect_entries",
  {
    contestEffectEffectEntryId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    contestEffectId: integer()
      .notNull()
      .references(() => contestEffectsTable.contestEffectId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    effect: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("contest_effect_effect_entries_ce_id_lang_id_unique").on(
      table.contestEffectId,
      table.localLanguageId,
    ),
  ],
);

export const contestEffectFlavorTextsTable = pokeApiSchema.table(
  "contest_effect_flavor_texts",
  {
    contestEffectFlavorTextId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    contestEffectId: integer()
      .notNull()
      .references(() => contestEffectsTable.contestEffectId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    flavorText: text().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("contest_effect_flavor_texts_ce_id_lang_id_unique").on(
      table.contestEffectId,
      table.localLanguageId,
    ),
  ],
);

// contest_types.berryFlavorId added in wave 8 after berry_flavors exists (circular FK).
export const contestTypesTable = pokeApiSchema.table("contest_types", {
  contestTypeId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  berryFlavorId: integer(),
  ...timestamps,
});

// names entries carry an extra `color` field (the type's associated color name)
export const contestTypeNamesTable = pokeApiSchema.table(
  "contest_type_names",
  {
    contestTypeNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    contestTypeId: integer()
      .notNull()
      .references(() => contestTypesTable.contestTypeId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    color: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("contest_type_names_ct_id_local_language_id_unique").on(
      table.contestTypeId,
      table.localLanguageId,
    ),
  ],
);

export const berryFlavorsTable = pokeApiSchema.table("berry_flavors", {
  berryFlavorId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  contestTypeId: integer()
    .notNull()
    .references(() => contestTypesTable.contestTypeId),
  ...timestamps,
});

export const berryFlavorNamesTable = pokeApiSchema.table(
  "berry_flavor_names",
  {
    berryFlavorNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    berryFlavorId: integer()
      .notNull()
      .references(() => berryFlavorsTable.berryFlavorId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("berry_flavor_names_bf_id_local_language_id_unique").on(
      table.berryFlavorId,
      table.localLanguageId,
    ),
  ],
);

// berries have no names array — names come from the linked item
export const berriesTable = pokeApiSchema.table("berries", {
  berryId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  growthTime: integer().notNull(),
  maxHarvest: integer().notNull(),
  naturalGiftPower: integer().notNull(),
  size: integer().notNull(),
  smoothness: integer().notNull(),
  soilDryness: integer().notNull(),
  berryFirmnessId: integer()
    .notNull()
    .references(() => berryFirmnessesTable.berryFirmnessId),
  itemId: integer().references(() => itemsTable.itemId),
  naturalGiftTypeId: integer().references(() => typesTable.typeId),
  ...timestamps,
});

export const berryFlavorPotenciesTable = pokeApiSchema.table(
  "berry_flavor_potencies",
  {
    berryFlavorPotencyId: integer().primaryKey().generatedAlwaysAsIdentity(),
    berryId: integer()
      .notNull()
      .references(() => berriesTable.berryId),
    berryFlavorId: integer()
      .notNull()
      .references(() => berryFlavorsTable.berryFlavorId),
    potency: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("berry_flavor_potencies_berry_id_flavor_id_unique").on(
      table.berryId,
      table.berryFlavorId,
    ),
  ],
);
