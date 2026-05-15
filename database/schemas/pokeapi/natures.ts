import { integer, pgSchema, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "../../utils/columnHelpers";
import { berryFlavorsTable } from "./berries-and-contests";
import { languagesTable } from "./languages";
import { moveBattleStylesTable } from "./move-basics";
import { pokeathlonStatsTable, statsTable } from "./stats";

const pokeApiSchema = pgSchema("pokeapi");

export const naturesTable = pokeApiSchema.table("natures", {
  natureId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 255 }).notNull(),
  decreasedStatId: integer().references(() => statsTable.statId),
  increasedStatId: integer().references(() => statsTable.statId),
  hatesFlavorId: integer().references(() => berryFlavorsTable.berryFlavorId),
  likesFlavorId: integer().references(() => berryFlavorsTable.berryFlavorId),
  ...timestamps,
});

export const natureNamesTable = pokeApiSchema.table(
  "nature_names",
  {
    natureNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    natureId: integer()
      .notNull()
      .references(() => naturesTable.natureId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("nature_names_nature_id_local_language_id_unique").on(
      table.natureId,
      table.localLanguageId,
    ),
  ],
);

export const naturePokeathlonStatChangesTable = pokeApiSchema.table(
  "nature_pokeathlon_stat_changes",
  {
    naturePokeathlonStatChangeId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    natureId: integer()
      .notNull()
      .references(() => naturesTable.natureId),
    pokeathlonStatId: integer()
      .notNull()
      .references(() => pokeathlonStatsTable.pokeathlonStatId),
    maxChange: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("nature_pokeathlon_stat_changes_nat_id_ps_id_unique").on(
      table.natureId,
      table.pokeathlonStatId,
    ),
  ],
);

export const natureBattleStylePreferencesTable = pokeApiSchema.table(
  "nature_battle_style_preferences",
  {
    natureBattleStylePreferenceId: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    natureId: integer()
      .notNull()
      .references(() => naturesTable.natureId),
    moveBattleStyleId: integer()
      .notNull()
      .references(() => moveBattleStylesTable.moveBattleStyleId),
    lowHpPreference: integer().notNull(),
    highHpPreference: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("nature_battle_style_prefs_nat_id_mbs_id_unique").on(
      table.natureId,
      table.moveBattleStyleId,
    ),
  ],
);
