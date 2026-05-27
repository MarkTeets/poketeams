import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { ModelResult } from "~/types";
import { logger } from "~/utils/logger.server";

import { db } from "../../database/db";
import {
  abilitiesTable,
  abilityNamesTable,
  eggGroupNamesTable,
  eggGroupsTable,
  evolutionChainsTable,
  generationsTable,
  growthRatesTable,
  pokemonAbilitiesTable,
  pokemonColorsTable,
  pokemonFormsTable,
  pokemonHabitatsTable,
  pokemonShapesTable,
  pokemonSpeciesEggGroupsTable,
  pokemonSpeciesEvolutionsTable,
  pokemonSpeciesFlavorTextsTable,
  pokemonSpeciesGeneraTable,
  pokemonSpeciesNamesTable,
  pokemonSpeciesTable,
  pokemonSpeciesVarietiesTable,
  pokemonStatsTable,
  pokemonTable,
  pokemonTypesTable,
  statNamesTable,
  statsTable,
  typeNamesTable,
  typesTable,
} from "../../database/schema";
import { getDbErrorMessage } from "../utils/dbErrorInterpreter";

export type PokemonRow = typeof pokemonTable.$inferSelect;
export type PokemonSpeciesRow = typeof pokemonSpeciesTable.$inferSelect;
export type PokemonTypeRow = typeof pokemonTypesTable.$inferSelect;
export type TypeRow = typeof typesTable.$inferSelect;
export type TypeNameRow = typeof typeNamesTable.$inferSelect;
export type PokemonAbilityRow = typeof pokemonAbilitiesTable.$inferSelect;
export type AbilityRow = typeof abilitiesTable.$inferSelect;
export type AbilityNameRow = typeof abilityNamesTable.$inferSelect;
export type PokemonStatRow = typeof pokemonStatsTable.$inferSelect;
export type StatRow = typeof statsTable.$inferSelect;
export type StatNameRow = typeof statNamesTable.$inferSelect;
export type PokemonFormRow = typeof pokemonFormsTable.$inferSelect;
export type PokemonSpeciesNameRow =
  typeof pokemonSpeciesNamesTable.$inferSelect;
export type PokemonSpeciesFlavorTextRow =
  typeof pokemonSpeciesFlavorTextsTable.$inferSelect;
export type PokemonSpeciesGenusRow =
  typeof pokemonSpeciesGeneraTable.$inferSelect;
export type PokemonSpeciesEggGroupRow =
  typeof pokemonSpeciesEggGroupsTable.$inferSelect;
export type EggGroupRow = typeof eggGroupsTable.$inferSelect;
export type EggGroupNameRow = typeof eggGroupNamesTable.$inferSelect;
export type EvolutionChainRow = typeof evolutionChainsTable.$inferSelect;
export type PokemonSpeciesEvolutionRow =
  typeof pokemonSpeciesEvolutionsTable.$inferSelect;
export type GenerationRow = typeof generationsTable.$inferSelect;
export type GrowthRateRow = typeof growthRatesTable.$inferSelect;
export type PokemonColorRow = typeof pokemonColorsTable.$inferSelect;
export type PokemonShapeRow = typeof pokemonShapesTable.$inferSelect;
export type PokemonHabitatRow = typeof pokemonHabitatsTable.$inferSelect;

export const getPokemonSpeciesById = async (
  id: number,
): Promise<ModelResult<PokemonSpeciesRow>> => {
  try {
    const result = await db
      .select()
      .from(pokemonSpeciesTable)
      .where(eq(pokemonSpeciesTable.pokemonSpeciesId, id));
    logger.debug({ result });
    const pokemonSpecies = result[0] ?? null;
    return { ok: true, data: pokemonSpecies };
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via pokeapi.getPokemonSpeciesById failure",
    );
    return { ok: false, message, constraint };
  }
};

export const getAllPokemonSpeciesDataById = async (id: number) => {
  const evolvesFromSpecies = alias(pokemonSpeciesTable, "evolves_from_species");
  try {
    const result = await db
      .select({
        pokemonSpeciesId: pokemonSpeciesTable.pokemonSpeciesId,
        name: pokemonSpeciesTable.name,
        url: pokemonSpeciesTable.url,
        order: pokemonSpeciesTable.order,
        genderRate: pokemonSpeciesTable.genderRate,
        captureRate: pokemonSpeciesTable.captureRate,
        baseHappiness: pokemonSpeciesTable.baseHappiness,
        isBaby: pokemonSpeciesTable.isBaby,
        isLegendary: pokemonSpeciesTable.isLegendary,
        isMythical: pokemonSpeciesTable.isMythical,
        hatchCounter: pokemonSpeciesTable.hatchCounter,
        hasGenderDifferences: pokemonSpeciesTable.hasGenderDifferences,
        formsSwitchable: pokemonSpeciesTable.formsSwitchable,
        generationId: pokemonSpeciesTable.generationId,
        growthRateId: pokemonSpeciesTable.growthRateId,
        pokemonColorId: pokemonSpeciesTable.pokemonColorId,
        pokemonShapeId: pokemonSpeciesTable.pokemonShapeId,
        pokemonHabitatId: pokemonSpeciesTable.pokemonHabitatId,
        evolvesFromSpeciesId: pokemonSpeciesTable.evolvesFromSpeciesId,
        evolutionChainId: pokemonSpeciesTable.evolutionChainId,
        generation: {
          generationId: generationsTable.generationId,
          name: generationsTable.name,
          url: generationsTable.url,
          mainRegionId: generationsTable.mainRegionId,
        },
        growthRate: {
          growthRateId: growthRatesTable.growthRateId,
          name: growthRatesTable.name,
          url: growthRatesTable.url,
          formula: growthRatesTable.formula,
        },
        pokemonColor: {
          pokemonColorId: pokemonColorsTable.pokemonColorId,
          name: pokemonColorsTable.name,
          url: pokemonColorsTable.url,
        },
        pokemonShape: {
          pokemonShapeId: pokemonShapesTable.pokemonShapeId,
          name: pokemonShapesTable.name,
          url: pokemonShapesTable.url,
        },
        pokemonHabitat: {
          pokemonHabitatId: pokemonHabitatsTable.pokemonHabitatId,
          name: pokemonHabitatsTable.name,
          url: pokemonHabitatsTable.url,
        },
        evolutionChain: {
          evolutionChainId: evolutionChainsTable.evolutionChainId,
          url: evolutionChainsTable.url,
          babyTriggerItemId: evolutionChainsTable.babyTriggerItemId,
        },
        evolvesFromSpecies: {
          pokemonSpeciesId: evolvesFromSpecies.pokemonSpeciesId,
          name: evolvesFromSpecies.name,
          url: evolvesFromSpecies.url,
        },
      })
      .from(pokemonSpeciesTable)
      .leftJoin(
        generationsTable,
        eq(pokemonSpeciesTable.generationId, generationsTable.generationId),
      )
      .leftJoin(
        growthRatesTable,
        eq(pokemonSpeciesTable.growthRateId, growthRatesTable.growthRateId),
      )
      .leftJoin(
        pokemonColorsTable,
        eq(
          pokemonSpeciesTable.pokemonColorId,
          pokemonColorsTable.pokemonColorId,
        ),
      )
      .leftJoin(
        pokemonShapesTable,
        eq(
          pokemonSpeciesTable.pokemonShapeId,
          pokemonShapesTable.pokemonShapeId,
        ),
      )
      .leftJoin(
        pokemonHabitatsTable,
        eq(
          pokemonSpeciesTable.pokemonHabitatId,
          pokemonHabitatsTable.pokemonHabitatId,
        ),
      )
      .leftJoin(
        evolutionChainsTable,
        eq(
          pokemonSpeciesTable.evolutionChainId,
          evolutionChainsTable.evolutionChainId,
        ),
      )
      .leftJoin(
        evolvesFromSpecies,
        eq(
          pokemonSpeciesTable.evolvesFromSpeciesId,
          evolvesFromSpecies.pokemonSpeciesId,
        ),
      )
      .where(eq(pokemonSpeciesTable.pokemonSpeciesId, id));
    logger.debug({ result }, "getAllPokemonSpeciesDataById");
    const pokemonSpecies = result[0] ?? null;
    return { ok: true, data: pokemonSpecies };
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via pokeapi.getAllPokemonSpeciesDataById failure",
    );
    return { ok: false, message, constraint };
  }
};

export const getPokemonDetailsByName = async (name: string) => {
  try {
    const baseInfo = await db
      .select({
        pokemon: {
          id: pokemonTable.pokemonId,
          name: pokemonTable.name,
          baseExperience: pokemonTable.baseExperience,
          height: pokemonTable.height,
          weight: pokemonTable.weight,
          isDefault: pokemonTable.isDefault,
          cryLatest: pokemonTable.cryLatest,
          cryLegacy: pokemonTable.cryLegacy,
        },
        pokemonSpecies: {
          id: pokemonSpeciesTable.pokemonSpeciesId,
          name: pokemonSpeciesTable.name,
          genderRate: pokemonSpeciesTable.genderRate,
          captureRate: pokemonSpeciesTable.captureRate,
          baseHappiness: pokemonSpeciesTable.baseHappiness,
          isBaby: pokemonSpeciesTable.isBaby,
          isLegendary: pokemonSpeciesTable.isLegendary,
          isMythical: pokemonSpeciesTable.isMythical,
          hatchCounter: pokemonSpeciesTable.hatchCounter,
          hasGenderDifferences: pokemonSpeciesTable.hasGenderDifferences,
          formsSwitchable: pokemonSpeciesTable.formsSwitchable,
          generationId: pokemonSpeciesTable.generationId,
          growthRateId: pokemonSpeciesTable.growthRateId,
          pokemonColorId: pokemonSpeciesTable.pokemonColorId,
          pokemonShapeId: pokemonSpeciesTable.pokemonShapeId,
          pokemonHabitatId: pokemonSpeciesTable.pokemonHabitatId,
          evolutionChainId: pokemonSpeciesTable.evolutionChainId,
        },
      })
      .from(pokemonTable)
      .fullJoin(
        pokemonSpeciesTable,
        eq(pokemonTable.pokemonSpeciesId, pokemonSpeciesTable.pokemonSpeciesId),
      )
      .where(eq(pokemonTable.name, name));

    logger.debug({ baseInfo }, "getPokemonDetailsByName baseInfo");
    if (!baseInfo[0]?.pokemon || !baseInfo[0]?.pokemonSpecies) {
      return { ok: true, data: null };
    }

    const varieties = await db
      .select({
        pokemonId: pokemonSpeciesVarietiesTable.pokemonId,
        pokemonName: pokemonTable.name,
        isDefault: pokemonSpeciesVarietiesTable.isDefault,
      })
      .from(pokemonSpeciesVarietiesTable)
      .leftJoin(
        pokemonTable,
        eq(pokemonSpeciesVarietiesTable.pokemonId, pokemonTable.pokemonId),
      )
      .orderBy(
        desc(pokemonSpeciesVarietiesTable.isDefault),
        pokemonTable.pokemonId,
      )
      .where(
        eq(
          pokemonSpeciesVarietiesTable.pokemonSpeciesId,
          baseInfo[0].pokemonSpecies.id,
        ),
      );

    logger.debug({ varieties }, "getPokemonDetailsByName varieties");

    const result = {
      pokemon: baseInfo[0].pokemon,
      pokemonSpecies: baseInfo[0].pokemonSpecies,
      varieties,
    };

    return { ok: true, data: result };
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via pokeapi.getPokemonDetailsByName failure",
    );
    return { ok: false, message, constraint };
  }
};

/*
export const getEvolutionChain = async (pokemonSpeciesId: number) => {
  const evolvedSpecies = alias(pokemonSpeciesTable, "evolved_species");
  try {
    const result = await db
      .select
      // {
      //   pokemonSpeciesId: pokemonSpeciesTable.pokemonSpeciesId,
      //   pokemonSpeciesName: pokemonSpeciesTable.name,
      //   evolutionChainId: evolutionChainsTable.evolutionChainId,
      //   babyTriggeredItem: evolutionChainsTable.babyTriggerItemId,
      //   itemName: itemsTable.name,
      //   pokemonSpeciesEvolutionId:
      //   pokemonSpeciesEvolutionsTable.pokemonSpeciesEvolutionId,
      //   evolvedSpeciesId: pokemonSpeciesEvolutionsTable.evolvedSpeciesId,
      //   evolvedSpeciesName: evolvedSpecies.name,
      //   triggerId: pokemonSpeciesEvolutionsTable.triggerId,
      //   itemId: pokemonSpeciesEvolutionsTable.itemId,
      //   heldItemId: pokemonSpeciesEvolutionsTable.heldItemId,
      //   knownMoveId: pokemonSpeciesEvolutionsTable.knownMoveId,
      //   knownMoveTypeId: pokemonSpeciesEvolutionsTable.knownMoveTypeId,
      //   locationId: pokemonSpeciesEvolutionsTable.locationId,
      //   partySpeciesId: pokemonSpeciesEvolutionsTable.partySpeciesId,
      //   partyTypeId: pokemonSpeciesEvolutionsTable.partyTypeId,
      //   tradeSpeciesId: pokemonSpeciesEvolutionsTable.tradeSpeciesId,
      //   regionId: pokemonSpeciesEvolutionsTable.regionId,
      //   genderId: pokemonSpeciesEvolutionsTable.genderId,
      //   minLevel: pokemonSpeciesEvolutionsTable.minLevel,
      //   minHappiness: pokemonSpeciesEvolutionsTable.minHappiness,
      //   minBeauty: pokemonSpeciesEvolutionsTable.minBeauty,
      //   minAffection: pokemonSpeciesEvolutionsTable.minAffection,
      //   minDamageTaken: pokemonSpeciesEvolutionsTable.minDamageTaken,
      //   minMoveCount: pokemonSpeciesEvolutionsTable.minMoveCount,
      //   minSteps: pokemonSpeciesEvolutionsTable.minSteps,
      //   relativePhysicalStats:
      //     pokemonSpeciesEvolutionsTable.relativePhysicalStats,
      //   needsOverworldRain: pokemonSpeciesEvolutionsTable.needsOverworldRain,
      //   needsMultiplayer: pokemonSpeciesEvolutionsTable.needsMultiplayer,
      //   turnUpsideDown: pokemonSpeciesEvolutionsTable.turnUpsideDown,
      //   timeOfDay: pokemonSpeciesEvolutionsTable.timeOfDay,
      //   baseForm: pokemonSpeciesEvolutionsTable.baseForm,
      //  }
      ()
      .from(pokemonSpeciesTable)
      .leftJoin(
        evolutionChainsTable,
        eq(
          pokemonSpeciesTable.evolutionChainId,
          evolutionChainsTable.evolutionChainId,
        ),
      )
      .leftJoin(
        itemsTable,
        eq(evolutionChainsTable.babyTriggerItemId, itemsTable.itemId),
      )
      .leftJoin(
        pokemonSpeciesEvolutionsTable,
        eq(
          evolutionChainsTable.evolutionChainId,
          pokemonSpeciesEvolutionsTable.evolutionChainId,
        ),
      )
      .leftJoin(
        evolvedSpecies,
        eq(
          pokemonSpeciesEvolutionsTable.evolvedSpeciesId,
          evolvedSpecies.pokemonSpeciesId,
        ),
      )
      .where(eq(pokemonSpeciesTable.pokemonSpeciesId, pokemonSpeciesId));
    logger.debug({ result }, "getEvolutionChain");
    const evolutionChain = result;
    return { ok: true, data: evolutionChain };
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via pokeapi.getEvolutionChain failure",
    );
    return { ok: false, message, constraint };
  }
};

export const getEvolutionChain2 = async (pokemonSpeciesId: number) => {
  // const evolveStartSpecies = alias(pokemonSpeciesTable, "evolve_start_species");
  // const evolveEndSpecies = alias(pokemonSpeciesTable, "evolve_end_species");
  const evolveStartPokemon = alias(pokemonTable, "evolve_start_pokemon");
  const evolveEndPokemon = alias(pokemonTable, "evolve_end_pokemon");
  try {
    const result = await db
      .select
      // {
      //   pokemonSpeciesId: pokemonSpeciesTable.pokemonSpeciesId,
      //   pokemonSpeciesName: pokemonSpeciesTable.name,
      //   evolutionChainId: evolutionChainsTable.evolutionChainId,
      //   babyTriggeredItem: evolutionChainsTable.babyTriggerItemId,
      //   itemName: itemsTable.name,
      //   pokemonSpeciesEvolutionId:
      //   pokemonSpeciesEvolutionsTable.pokemonSpeciesEvolutionId,
      //   evolvedSpeciesId: pokemonSpeciesEvolutionsTable.evolvedSpeciesId,
      //   evolvedSpeciesName: evolvedSpecies.name,
      //   triggerId: pokemonSpeciesEvolutionsTable.triggerId,
      //   itemId: pokemonSpeciesEvolutionsTable.itemId,
      //   heldItemId: pokemonSpeciesEvolutionsTable.heldItemId,
      //   knownMoveId: pokemonSpeciesEvolutionsTable.knownMoveId,
      //   knownMoveTypeId: pokemonSpeciesEvolutionsTable.knownMoveTypeId,
      //   locationId: pokemonSpeciesEvolutionsTable.locationId,
      //   partySpeciesId: pokemonSpeciesEvolutionsTable.partySpeciesId,
      //   partyTypeId: pokemonSpeciesEvolutionsTable.partyTypeId,
      //   tradeSpeciesId: pokemonSpeciesEvolutionsTable.tradeSpeciesId,
      //   regionId: pokemonSpeciesEvolutionsTable.regionId,
      //   genderId: pokemonSpeciesEvolutionsTable.genderId,
      //   minLevel: pokemonSpeciesEvolutionsTable.minLevel,
      //   minHappiness: pokemonSpeciesEvolutionsTable.minHappiness,
      //   minBeauty: pokemonSpeciesEvolutionsTable.minBeauty,
      //   minAffection: pokemonSpeciesEvolutionsTable.minAffection,
      //   minDamageTaken: pokemonSpeciesEvolutionsTable.minDamageTaken,
      //   minMoveCount: pokemonSpeciesEvolutionsTable.minMoveCount,
      //   minSteps: pokemonSpeciesEvolutionsTable.minSteps,
      //   relativePhysicalStats:
      //     pokemonSpeciesEvolutionsTable.relativePhysicalStats,
      //   needsOverworldRain: pokemonSpeciesEvolutionsTable.needsOverworldRain,
      //   needsMultiplayer: pokemonSpeciesEvolutionsTable.needsMultiplayer,
      //   turnUpsideDown: pokemonSpeciesEvolutionsTable.turnUpsideDown,
      //   timeOfDay: pokemonSpeciesEvolutionsTable.timeOfDay,
      //   baseForm: pokemonSpeciesEvolutionsTable.baseForm,
      //  }
      ()
      .from(pokemonSpeciesTable)
      .leftJoin(
        evolutionChainsTable,
        eq(
          pokemonSpeciesTable.evolutionChainId,
          evolutionChainsTable.evolutionChainId,
        ),
      )
      .leftJoin(
        itemsTable,
        eq(evolutionChainsTable.babyTriggerItemId, itemsTable.itemId),
      )
      .leftJoin(
        pokemonSpeciesEvolutionsTable,
        eq(
          evolutionChainsTable.evolutionChainId,
          pokemonSpeciesEvolutionsTable.evolutionChainId,
        ),
      )
      .leftJoin(
        evolutionTriggersTable,
        eq(
          pokemonSpeciesEvolutionsTable.triggerId,
          evolutionTriggersTable.evolutionTriggerId,
        ),
      )
      .leftJoin(
        evolveStartPokemon,
        eq(
          pokemonSpeciesEvolutionsTable.evolveStartPokemonId,
          evolveStartPokemon.pokemonId,
        ),
    )
      .leftJoin(
        evolveEndPokemon,
        eq(
          pokemonSpeciesEvolutionsTable.evolveEndPokemonId,
          evolveEndPokemon.pokemonId,
        ),
      )
      .where(eq(pokemonSpeciesTable.pokemonSpeciesId, pokemonSpeciesId));
    logger.debug({ result }, "getEvolutionChain");
    const evolutionChain = result;
    return { ok: true, data: evolutionChain };
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via pokeapi.getEvolutionChain failure",
    );
    return { ok: false, message, constraint };
  }
};
// pokemonSpeciesVarietiesTable
const getVarietyBySpeciesId = async (pokemonSpeciesId: number) => {
try {
    const result = await db
      .select()
      .from(pokemonSpeciesVarietiesTable)
      .where(eq(pokemonSpeciesVarietiesTable.pokemonSpeciesId, pokemonSpeciesId));
    logger.debug({ result });
    return { ok: true, data: result };
  } catch (err) {
    const { message, constraint } = getDbErrorMessage(err);
    logger.error(
      { err, message, constraint },
      "Database call via pokeapi.getPokemonSpeciesById failure",
    );
    return { ok: false, message, constraint };
  }
}

async function printThis() {
  try {
    logger.debug(
      { final: await getPokemonDetailsByName("charmander") },
      "final result",
    );
  } catch (err) {
    logger.error({ err }, "DB failed");
    process.exit(1);
  } finally {
    await db.$client.end();
  }
}

printThis();
*/
