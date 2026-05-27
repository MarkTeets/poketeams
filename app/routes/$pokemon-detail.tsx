import { useLoaderData } from "react-router";

import { getPokemonDetailsByName } from "~/models/pokeapi.server";
import { pokemonNames } from "~/utils/pokemonNames";
import { sendResponseData, sendResponseError } from "~/utils/response-package";
import { capitalize } from "~/utils/string-format";

import type { Route } from "./+types/$pokemon-detail";

export async function loader({ params }: Route.LoaderArgs) {
  const pokemonNameRaw = params.pokemonName.toLowerCase();
  const pokemonName = pokemonNameRaw.toLowerCase();
  if (!pokemonNames.includes(pokemonName)) {
    return sendResponseError({
      message: `No pokemon was found by name "${pokemonNameRaw}"`,
    });
  }
  const response = await getPokemonDetailsByName(pokemonName);
  if (!response.ok) {
    return sendResponseError({
      message: `A database error occurred for pokemon ${pokemonNameRaw}`,
    });
  }
  if (!response.data) {
    return sendResponseError({
      message: `No data was found for pokemon ${pokemonNameRaw}`,
    });
  }
  return sendResponseData(response.data);
}

export default function PokemonDetail() {
  const { data: loaderData, errors } = useLoaderData<typeof loader>();

  if (
    errors ||
    !loaderData?.pokemon ||
    !loaderData?.pokemonSpecies ||
    !loaderData?.varieties
  ) {
    return (
      <div>
        <h1>This is not the page you were looking for...</h1>
        {errors?.message ? (
          <div>
            <h2>Errors</h2>
            <p>{errors?.message}</p>
          </div>
        ) : null}
      </div>
    );
  }

  const { pokemon, pokemonSpecies, varieties } = loaderData;

  const printSpecies = () => {
    console.log(varieties);
    if (varieties.length === 1) {
      return null;
    }

    return (
      <div>
        <h2>Species</h2>
        <p>{pokemonSpecies.name}</p>
      </div>
    );
  };

  const printVarieties = () => {
    console.log({ vl: varieties.length });
    if (varieties.length === 1) {
      return null;
    }
    const varietyList = varieties.map((v) => {
      return <p>Name: {v.pokemonName}</p>;
    });
    return (
      <div>
        <h2>Varieties</h2>
        {varietyList}
      </div>
    );
  };

  return (
    <div>
      <h1>{capitalize(pokemon.name)}</h1>
      {printSpecies()}
      {printVarieties()}
    </div>
  );
}
