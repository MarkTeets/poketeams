import { relations } from "drizzle-orm";

import {
  abilitiesTable,
  abilityEffectEntriesTable,
  abilityFlavorTextsTable,
  abilityNamesTable,
} from "./pokeapi/abilities";
import {
  evolutionChainsTable,
  pokemonSpeciesEggGroupsTable,
  pokemonSpeciesEvolutionsTable,
  pokemonSpeciesFlavorTextsTable,
  pokemonSpeciesFormDescriptionsTable,
  pokemonSpeciesGeneraTable,
  pokemonSpeciesNamesTable,
  pokemonSpeciesPalParkEncountersTable,
  pokemonSpeciesTable,
  pokemonSpeciesVarietiesTable,
} from "./pokeapi/pokemon-species";
import {
  pokemonAbilitiesTable,
  pokemonAbilityHistoryTable,
  pokemonGameIndicesTable,
  pokemonHeldItemsTable,
  pokemonMovesTable,
  pokemonSpritesTable,
  pokemonStatHistoryTable,
  pokemonStatsTable,
  pokemonTable,
  pokemonTypeHistoryTable,
  pokemonTypesTable,
} from "./pokeapi/pokemon";

export const pokemonSpeciesRelations = relations(
  pokemonSpeciesTable,
  ({ one, many }) => ({
    evolutionChain: one(evolutionChainsTable, {
      fields: [pokemonSpeciesTable.evolutionChainId],
      references: [evolutionChainsTable.evolutionChainId],
    }),
    evolvesFromSpecies: one(pokemonSpeciesTable, {
      fields: [pokemonSpeciesTable.evolvesFromSpeciesId],
      references: [pokemonSpeciesTable.pokemonSpeciesId],
      relationName: "evolves_from",
    }),
    evolvesTo: many(pokemonSpeciesTable, { relationName: "evolves_from" }),
    names: many(pokemonSpeciesNamesTable),
    flavorTexts: many(pokemonSpeciesFlavorTextsTable),
    genera: many(pokemonSpeciesGeneraTable),
    formDescriptions: many(pokemonSpeciesFormDescriptionsTable),
    eggGroups: many(pokemonSpeciesEggGroupsTable),
    palParkEncounters: many(pokemonSpeciesPalParkEncountersTable),
    varieties: many(pokemonSpeciesVarietiesTable),
    evolutionsTo: many(pokemonSpeciesEvolutionsTable, {
      relationName: "pse_end_species",
    }),
    evolutionsFrom: many(pokemonSpeciesEvolutionsTable, {
      relationName: "pse_start_species",
    }),
  }),
);

export const evolutionChainsRelations = relations(
  evolutionChainsTable,
  ({ many }) => ({
    species: many(pokemonSpeciesTable),
    evolutions: many(pokemonSpeciesEvolutionsTable),
  }),
);

export const pokemonSpeciesEvolutionsRelations = relations(
  pokemonSpeciesEvolutionsTable,
  ({ one }) => ({
    evolutionChain: one(evolutionChainsTable, {
      fields: [pokemonSpeciesEvolutionsTable.evolutionChainId],
      references: [evolutionChainsTable.evolutionChainId],
    }),
    evolveStartSpecies: one(pokemonSpeciesTable, {
      fields: [pokemonSpeciesEvolutionsTable.evolveStartSpeciesId],
      references: [pokemonSpeciesTable.pokemonSpeciesId],
      relationName: "pse_start_species",
    }),
    evolveEndSpecies: one(pokemonSpeciesTable, {
      fields: [pokemonSpeciesEvolutionsTable.evolveEndSpeciesId],
      references: [pokemonSpeciesTable.pokemonSpeciesId],
      relationName: "pse_end_species",
    }),
  }),
);

export const pokemonSpeciesVarietiesRelations = relations(
  pokemonSpeciesVarietiesTable,
  ({ one }) => ({
    species: one(pokemonSpeciesTable, {
      fields: [pokemonSpeciesVarietiesTable.pokemonSpeciesId],
      references: [pokemonSpeciesTable.pokemonSpeciesId],
    }),
  }),
);

export const pokemonRelations = relations(pokemonTable, ({ one, many }) => ({
  species: one(pokemonSpeciesTable, {
    fields: [pokemonTable.pokemonSpeciesId],
    references: [pokemonSpeciesTable.pokemonSpeciesId],
  }),
  abilities: many(pokemonAbilitiesTable),
  types: many(pokemonTypesTable),
  stats: many(pokemonStatsTable),
  moves: many(pokemonMovesTable),
  gameIndices: many(pokemonGameIndicesTable),
  heldItems: many(pokemonHeldItemsTable),
  sprites: many(pokemonSpritesTable),
  typeHistory: many(pokemonTypeHistoryTable),
  abilityHistory: many(pokemonAbilityHistoryTable),
  statHistory: many(pokemonStatHistoryTable),
}));

export const pokemonAbilitiesRelations = relations(
  pokemonAbilitiesTable,
  ({ one }) => ({
    pokemon: one(pokemonTable, {
      fields: [pokemonAbilitiesTable.pokemonId],
      references: [pokemonTable.pokemonId],
    }),
    ability: one(abilitiesTable, {
      fields: [pokemonAbilitiesTable.abilityId],
      references: [abilitiesTable.abilityId],
    }),
  }),
);

export const abilitiesRelations = relations(abilitiesTable, ({ many }) => ({
  names: many(abilityNamesTable),
  effectEntries: many(abilityEffectEntriesTable),
  flavorTexts: many(abilityFlavorTextsTable),
  pokemonAbilities: many(pokemonAbilitiesTable),
}));
