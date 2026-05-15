import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { generationsTable } from "./generations";
import { languagesTable } from "./languages";
import { moveDamageClassesTable } from "./move-basics";

const pokeApiSchema = pgSchema("pokeapi");

export const typesTable = pokeApiSchema.table("types", {
  typeId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  generationId: integer().references(() => generationsTable.generationId),
  moveDamageClassId: integer().references(
    () => moveDamageClassesTable.moveDamageClassId,
  ),
  ...timestamps,
});

export const typeNamesTable = pokeApiSchema.table(
  "type_names",
  {
    typeNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    typeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("type_names_type_id_local_language_id_unique").on(
      table.typeId,
      table.localLanguageId,
    ),
  ],
);

// damageFactor: 0 = no damage, 50 = half, 200 = double (percent)
export const typeEfficacyTable = pokeApiSchema.table(
  "type_efficacy",
  {
    typeEfficacyId: integer().primaryKey().generatedAlwaysAsIdentity(),
    attackingTypeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    defendingTypeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    damageFactor: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("type_efficacy_attacking_defending_unique").on(
      table.attackingTypeId,
      table.defendingTypeId,
    ),
  ],
);

export const typeGameIndicesTable = pokeApiSchema.table(
  "type_game_indices",
  {
    typeGameIndexId: integer().primaryKey().generatedAlwaysAsIdentity(),
    typeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    gameIndex: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("type_game_indices_type_id_generation_id_unique").on(
      table.typeId,
      table.generationId,
    ),
  ],
);
