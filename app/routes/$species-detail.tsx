import { useLoaderData } from "react-router";

import { getAllPokemonSpeciesDataById } from "~/models/pokeapi.server";
import { logger } from "~/utils/logger.server";
import { sendResponseData, sendResponseError } from "~/utils/response-package";
import { capitalize } from "~/utils/string-format";

import type { Route } from "./+types/$species-detail";

export async function loader({ params }: Route.LoaderArgs) {
  const pokeApiId = params.pokeApiId;
  const response = await getAllPokemonSpeciesDataById(Number(pokeApiId));
  if (!response.ok) {
    return sendResponseError(
      { message: "There was a database error. Please try again later" },
      500,
    );
  }
  if (response.data === null) {
    logger.warn({ pokeApiId }, "No species data found for pokemon id");
    return sendResponseError({
      message: `No data was found for pokemon id ${pokeApiId}`,
    });
  }
  return sendResponseData({ speciesData: response.data });
}

export default function SpeciesDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const speciesData = loaderData?.data?.speciesData;
  return !speciesData ? (
    <div>No species data was retrieved</div>
  ) : (
    <div>
      <h1>{capitalize(speciesData.name)}</h1>
      <p>Species ID: {speciesData.pokemonSpeciesId}</p>
      <p>Order: {speciesData.order}</p>
      <p>Gender Rate: {speciesData.genderRate}</p>
      <p>Capture Rate: {speciesData.captureRate}</p>
      <p>Base Happiness: {speciesData.baseHappiness}</p>
      <p>Hatch Counter: {speciesData.hatchCounter}</p>
      <p>Baby: {speciesData.isBaby ? "Yes" : "No"}</p>
      <p>Legendary: {speciesData.isLegendary ? "Yes" : "No"}</p>
      <p>Mythical: {speciesData.isMythical ? "Yes" : "No"}</p>
      <p>
        Gender Differences: {speciesData.hasGenderDifferences ? "Yes" : "No"}
      </p>
      <p>Forms Switchable: {speciesData.formsSwitchable ? "Yes" : "No"}</p>
      {speciesData.generation && (
        <p>Generation: {capitalize(speciesData.generation.name)}</p>
      )}
      {speciesData.growthRate && (
        <p>Growth Rate: {capitalize(speciesData.growthRate.name)}</p>
      )}
      {speciesData.pokemonColor && (
        <p>Color: {capitalize(speciesData.pokemonColor.name)}</p>
      )}
      {speciesData.pokemonShape && (
        <p>Shape: {capitalize(speciesData.pokemonShape.name)}</p>
      )}
      {speciesData.pokemonHabitat && (
        <p>Habitat: {capitalize(speciesData.pokemonHabitat.name)}</p>
      )}
      {speciesData.evolvesFromSpecies && (
        <p>Evolves From: {capitalize(speciesData.evolvesFromSpecies.name)}</p>
      )}
      {speciesData.evolutionChain && (
        <p>Evolution Chain ID: {speciesData.evolutionChain.evolutionChainId}</p>
      )}
    </div>
  );
}
