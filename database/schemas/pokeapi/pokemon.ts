import {
  boolean,
  integer,
  pgSchema,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { abilitiesTable } from "./abilities";
import {
  generationsTable,
  versionGroupsTable,
  versionsTable,
} from "./generations";
import { itemsTable } from "./items";
import { moveLearnMethodsTable } from "./move-basics";
import { movesTable } from "./moves";
import { pokemonSpeciesTable } from "./pokemon-species";
import { statsTable } from "./stats";
import { typesTable } from "./types";

const pokeApiSchema = pgSchema("pokeapi");

export const pokemonTable = pokeApiSchema.table("pokemon", {
  pokemonId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  baseExperience: integer(),
  height: integer().notNull(),
  weight: integer().notNull(),
  order: integer().notNull(),
  isDefault: boolean().notNull(),
  pokemonSpeciesId: integer()
    .notNull()
    .references(() => pokemonSpeciesTable.pokemonSpeciesId),
  cryLatest: varchar({ length: 255 }),
  cryLegacy: varchar({ length: 255 }),
  ...timestamps,
});

export const pokemonAbilitiesTable = pokeApiSchema.table(
  "pokemon_abilities",
  {
    pokemonAbilityId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    abilityId: integer()
      .notNull()
      .references(() => abilitiesTable.abilityId),
    isHidden: boolean().notNull(),
    slot: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_abilities_pokemon_id_slot_unique").on(
      table.pokemonId,
      table.slot,
    ),
  ],
);

export const pokemonTypesTable = pokeApiSchema.table(
  "pokemon_types",
  {
    pokemonTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    typeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    slot: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_types_pokemon_id_slot_unique").on(
      table.pokemonId,
      table.slot,
    ),
  ],
);

export const pokemonStatsTable = pokeApiSchema.table(
  "pokemon_stats",
  {
    pokemonStatId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    statId: integer()
      .notNull()
      .references(() => statsTable.statId),
    baseStat: integer().notNull(),
    effort: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_stats_pokemon_id_stat_id_unique").on(
      table.pokemonId,
      table.statId,
    ),
  ],
);

// Each move × version_group × learn_method combination is one row.
export const pokemonMovesTable = pokeApiSchema.table(
  "pokemon_moves",
  {
    pokemonMoveId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    moveId: integer()
      .notNull()
      .references(() => movesTable.moveId),
    versionGroupId: integer()
      .notNull()
      .references(() => versionGroupsTable.versionGroupId),
    moveLearnMethodId: integer()
      .notNull()
      .references(() => moveLearnMethodsTable.moveLearnMethodId),
    levelLearnedAt: integer().notNull(),
    order: integer(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_moves_pokemon_id_move_id_vg_id_mlm_id_unique").on(
      table.pokemonId,
      table.moveId,
      table.versionGroupId,
      table.moveLearnMethodId,
    ),
  ],
);

export const pokemonGameIndicesTable = pokeApiSchema.table(
  "pokemon_game_indices",
  {
    pokemonGameIndexId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    versionId: integer()
      .notNull()
      .references(() => versionsTable.versionId),
    gameIndex: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_game_indices_pokemon_id_version_id_unique").on(
      table.pokemonId,
      table.versionId,
    ),
  ],
);

export const pokemonHeldItemsTable = pokeApiSchema.table(
  "pokemon_held_items",
  {
    pokemonHeldItemId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    itemId: integer()
      .notNull()
      .references(() => itemsTable.itemId),
    versionId: integer()
      .notNull()
      .references(() => versionsTable.versionId),
    rarity: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_held_items_pokemon_id_item_id_version_id_unique").on(
      table.pokemonId,
      table.itemId,
      table.versionId,
    ),
  ],
);

export const pokemonPastTypesTable = pokeApiSchema.table(
  "pokemon_past_types",
  {
    pokemonPastTypeId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    typeId: integer()
      .notNull()
      .references(() => typesTable.typeId),
    slot: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pokemon_past_types_pokemon_id_generation_id_slot_unique").on(
      table.pokemonId,
      table.generationId,
      table.slot,
    ),
  ],
);

export const pokemonPastAbilitiesTable = pokeApiSchema.table(
  "pokemon_past_abilities",
  {
    pokemonPastAbilityId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    abilityId: integer().references(() => abilitiesTable.abilityId),
    isHidden: boolean().notNull(),
    slot: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex(
      "pokemon_past_abilities_pokemon_id_generation_id_slot_unique",
    ).on(table.pokemonId, table.generationId, table.slot),
  ],
);

export const pokemonPastStatsTable = pokeApiSchema.table(
  "pokemon_past_stats",
  {
    pokemonPastStatId: integer().primaryKey().generatedAlwaysAsIdentity(),
    pokemonId: integer()
      .notNull()
      .references(() => pokemonTable.pokemonId),
    generationId: integer()
      .notNull()
      .references(() => generationsTable.generationId),
    statId: integer()
      .notNull()
      .references(() => statsTable.statId),
    baseStat: integer().notNull(),
    effort: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex(
      "pokemon_past_stats_pokemon_id_generation_id_stat_id_unique",
    ).on(table.pokemonId, table.generationId, table.statId),
  ],
);
