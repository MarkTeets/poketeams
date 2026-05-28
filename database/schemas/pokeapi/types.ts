import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { generationsTable } from "./generations";
import { languagesTable } from "./languages";
import { moveDamageClassesTable } from "./move-basics";

const pokeApiSchema = pgSchema("pokeapi");

export const typesTable = pokeApiSchema.table("types", {
  typeId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  generationId: integer().references(() => generationsTable.generationId),
  moveDamageClassId: integer().references(
    () => moveDamageClassesTable.moveDamageClassId,
  ),
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
  },
  (table) => [
    uniqueIndex("type_game_indices_type_id_generation_id_unique").on(
      table.typeId,
      table.generationId,
    ),
  ],
);

// Per-game type icon URLs (name_icon + symbol_icon variants) across generations.
// Mirrors pokemonSpritesTable structure.
export const typeSpritesTable = pokeApiSchema.table(
  "type_sprites",
  {
    typeSpriteId: integer().primaryKey().generatedAlwaysAsIdentity(),
    typeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    gameName: varchar({ length: 100 }).notNull(),
    variant: varchar({ length: 50 }).notNull(),
    url: varchar({ length: 500 }).notNull(),
  },
  (table) => [
    uniqueIndex("type_sprites_type_id_game_name_variant_unique").on(
      table.typeId,
      table.gameName,
      table.variant,
    ),
  ],
);

// Historical damage relations from type.past_damage_relations[].
// One row per (attacking, defending, generation) tuple — discriminator is generationId
// (type changes are tracked per generation in PokeAPI's data model).
export const typeEfficacyHistoryTable = pokeApiSchema.table(
  "type_efficacy_history",
  {
    typeEfficacyHistoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    attackingTypeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    defendingTypeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    damageFactor: integer().notNull(),
  },
  (table) => [
    uniqueIndex("type_efficacy_history_gen_atk_def_unique").on(
      table.generationId,
      table.attackingTypeId,
      table.defendingTypeId,
    ),
  ],
);
