import {
  integer,
  pgSchema,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { languagesTable } from "./languages";

const pokeApiSchema = pgSchema("pokeapi");

export const regionsTable = pokeApiSchema.table("regions", {
  regionId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const regionNamesTable = pokeApiSchema.table(
  "region_names",
  {
    regionNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    regionId: integer()
      .notNull()
      .references(() => regionsTable.regionId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("region_names_region_id_local_language_id_unique").on(
      table.regionId,
      table.localLanguageId,
    ),
  ],
);

export const palParkAreasTable = pokeApiSchema.table("pal_park_areas", {
  palParkAreaId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
});

export const palParkAreaNamesTable = pokeApiSchema.table(
  "pal_park_area_names",
  {
    palParkAreaNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    palParkAreaId: integer()
      .notNull()
      .references(() => palParkAreasTable.palParkAreaId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("pal_park_area_names_ppa_id_local_language_id_unique").on(
      table.palParkAreaId,
      table.localLanguageId,
    ),
  ],
);

export const growthRatesTable = pokeApiSchema.table("growth_rates", {
  growthRateId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  formula: text().notNull(),
});

export const growthRateDescriptionsTable = pokeApiSchema.table(
  "growth_rate_descriptions",
  {
    growthRateDescriptionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    growthRateId: integer()
      .notNull()
      .references(() => growthRatesTable.growthRateId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    description: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("growth_rate_descriptions_gr_id_local_language_id_unique").on(
      table.growthRateId,
      table.localLanguageId,
    ),
  ],
);

// Full 100-row EXP-per-level table per growth rate.
export const growthRateLevelsTable = pokeApiSchema.table(
  "growth_rate_levels",
  {
    growthRateLevelId: integer().primaryKey().generatedAlwaysAsIdentity(),
    growthRateId: integer()
      .notNull()
      .references(() => growthRatesTable.growthRateId),
    level: integer().notNull(),
    experience: integer().notNull(),
  },
  (table) => [
    uniqueIndex("growth_rate_levels_gr_id_level_unique").on(
      table.growthRateId,
      table.level,
    ),
  ],
);

export const locationsTable = pokeApiSchema.table("locations", {
  locationId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  regionId: integer().references(() => regionsTable.regionId),
});

export const locationNamesTable = pokeApiSchema.table(
  "location_names",
  {
    locationNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    locationId: integer()
      .notNull()
      .references(() => locationsTable.locationId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("location_names_location_id_local_language_id_unique").on(
      table.locationId,
      table.localLanguageId,
    ),
  ],
);

export const locationAreasTable = pokeApiSchema.table("location_areas", {
  locationAreaId: integer().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }).notNull(),
  gameIndex: integer().notNull(),
  locationId: integer()
    .notNull()
    .references(() => locationsTable.locationId),
});

export const locationAreaNamesTable = pokeApiSchema.table(
  "location_area_names",
  {
    locationAreaNameId: integer().primaryKey().generatedAlwaysAsIdentity(),
    locationAreaId: integer()
      .notNull()
      .references(() => locationAreasTable.locationAreaId),
    localLanguageId: integer()
      .notNull()
      .references(() => languagesTable.languageId),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex("location_area_names_la_id_local_language_id_unique").on(
      table.locationAreaId,
      table.localLanguageId,
    ),
  ],
);
