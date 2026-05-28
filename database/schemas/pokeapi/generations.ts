import {
  type AnyPgColumn,
  integer,
  pgSchema,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { languagesTable } from "./languages";
import { moveLearnMethodsTable } from "./move-basics";
import { regionsTable } from "./regions";

const pokeApiSchema = pgSchema("pokeapi");

export const evolutionTriggersTable = pokeApiSchema.table(
  "evolution_triggers",
  {
    evolutionTriggerId: integer().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    url: varchar({ length: 500 }).notNull(),
  },
);

export const evolutionTriggerNamesTable = pokeApiSchema.table(
  "evolution_trigger_names",
  {
    evolutionTriggerNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    evolutionTriggerId: integer()
      .notNull()
      .references(() => evolutionTriggersTable.evolutionTriggerId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("evolution_trigger_names_et_id_local_language_id_unique").on(
      table.evolutionTriggerId,
      table.localLanguageId,
    ),
  ],
);

export const generationsTable = pokeApiSchema.table("generations", {
  generationId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  mainRegionId: integer().references((): AnyPgColumn => regionsTable.regionId),
});

export const generationNamesTable = pokeApiSchema.table(
  "generation_names",
  {
    generationNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("generation_names_gen_id_local_language_id_unique").on(
      table.generationId,
      table.localLanguageId,
    ),
  ],
);

// version_groups has no names array — just the resource row + join tables
export const versionGroupsTable = pokeApiSchema.table("version_groups", {
  versionGroupId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  order: integer().notNull(),
  generationId: integer()
    .notNull()
    .references(() => generationsTable.generationId),
});

export const versionGroupMoveLearnMethodsTable = pokeApiSchema.table(
  "version_group_move_learn_methods",
  {
    versionGroupMoveLearnMethodId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    moveLearnMethodId: integer()
      .notNull()
      .references(() => moveLearnMethodsTable.moveLearnMethodId),
  },
  (table) => [
    uniqueIndex("vg_move_learn_methods_vg_id_mlm_id_unique").on(
      table.versionGroupId,
      table.moveLearnMethodId,
    ),
  ],
);

export const versionGroupRegionsTable = pokeApiSchema.table(
  "version_group_regions",
  {
    versionGroupRegionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    regionId: integer()
      .notNull()
      .references(() => regionsTable.regionId),
  },
  (table) => [
    uniqueIndex("version_group_regions_vg_id_region_id_unique").on(
      table.versionGroupId,
      table.regionId,
    ),
  ],
);

export const versionsTable = pokeApiSchema.table("versions", {
  versionId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  versionGroupId: integer()
    .notNull()
    .references(() => versionGroupsTable.versionGroupId),
});

export const versionNamesTable = pokeApiSchema.table(
  "version_names",
  {
    versionNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    versionId: integer()
      .notNull()
      .references(() => versionsTable.versionId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("version_names_version_id_local_language_id_unique").on(
      table.versionId,
      table.localLanguageId,
    ),
  ],
);
