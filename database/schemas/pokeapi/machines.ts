import { integer, pgSchema, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { versionGroupsTable } from "./generations";
import { itemsTable } from "./items";
import { movesTable } from "./moves";

const pokeApiSchema = pgSchema("pokeapi");

export const machinesTable = pokeApiSchema.table("machines", {
  machineId: integer().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  itemId: integer()
    .notNull()
    .references(() => itemsTable.itemId),
  moveId: integer()
    .notNull()
    .references(() => movesTable.moveId),
  versionGroupId: integer()
    .notNull()
    .references(() => versionGroupsTable.versionGroupId),
  ...timestamps,
});
