import { boolean, integer, pgSchema, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../utils/columnHelpers";
import { usersTable } from "./app_user";

const trainerSchema = pgSchema("trainer");

export const trainersTable = trainerSchema.table("trainers", {
  trainerId: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.userId),
  trainerName: varchar({ length: 255 }).notNull(),
  idNo: integer(),
  ...timestamps,
});

export const pokemonTable = trainerSchema.table("pokemon", {
  pokemonId: integer().primaryKey().generatedAlwaysAsIdentity(),
  pokeApiId: integer().notNull(),
  name: varchar({ length: 255 }).notNull(),
  nickname: varchar({ length: 255 }),
  ability: varchar({ length: 255 }),
  level: integer(),
  form: varchar({ length: 255 }),
  gender: varchar({ length: 50 }),
  shiny: boolean(),
  heldItem: varchar({ length: 255 }),
  move1: varchar("move_1", { length: 255 }),
  move2: varchar("move_2", { length: 255 }),
  move3: varchar("move_3", { length: 255 }),
  move4: varchar("move_4", { length: 255 }),
  ivHp: integer(),
  ivAttack: integer(),
  ivDefense: integer(),
  ivSpecialAttack: integer(),
  ivSpecialDefense: integer(),
  ivSpeed: integer(),
  evHp: integer(),
  evAttack: integer(),
  evDefense: integer(),
  evSpecialAttack: integer(),
  evSpecialDefense: integer(),
  evSpeed: integer(),
  teraType: varchar({ length: 255 }),
  ...timestamps,
});

export const pcBoxesTable = trainerSchema.table("pc_boxes", {
  pcBoxId: integer().primaryKey().generatedAlwaysAsIdentity(),
  trainerId: integer().notNull().references(() => trainersTable.trainerId),
  boxName: varchar({ length: 255 }),
  boxOrder: integer(),
  ...timestamps,
});

export const pokemonToPcBoxTable = trainerSchema.table("pokemon_to_pc_box", {
  pokemonToPcBoxId: integer().primaryKey().generatedAlwaysAsIdentity(),
  pokemonId: integer().notNull().references(() => pokemonTable.pokemonId),
  pcBoxId: integer().notNull().references(() => pcBoxesTable.pcBoxId),
  ...timestamps,
});

export const teamsTable = trainerSchema.table("teams", {
  teamId: integer().primaryKey().generatedAlwaysAsIdentity(),
  trainerId: integer().notNull().references(() => trainersTable.trainerId),
  teamName: varchar({ length: 255 }),
  teamOrder: integer(),
  ...timestamps,
});

export const pokemonToTeamTable = trainerSchema.table("pokemon_to_team", {
  pokemonToTeamId: integer().primaryKey().generatedAlwaysAsIdentity(),
  pokemonId: integer().notNull().references(() => pokemonTable.pokemonId),
  teamId: integer().notNull().references(() => teamsTable.teamId),
  ...timestamps,
});
