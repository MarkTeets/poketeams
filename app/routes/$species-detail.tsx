import { useLoaderData } from "react-router";

import type { Route } from "./+types/$species-detail";

export async function loader({ params }: Route.LoaderArgs) {
  const pokeApiId = params.pokeApiId;
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokeApiId}/`,
  );
  if (response.ok) {
    const data = await response.json();
    return { data };
  }
  return null;
}

export default function SpeciesDetail() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div>
      {loaderData?.data ? (
        <div>{JSON.stringify(loaderData.data)}</div>
      ) : (
        <div>species detail</div>
      )}
    </div>
  );
}
