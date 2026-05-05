import { useLoaderData } from "react-router";

import { getAllUsers, getUserByEmail } from "../../database/models/app_user";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PokeTeams" },
    { name: "PokeTeams", content: "Gotta catch 'em all!" },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  // const results = await getAllUsers();
  const results = await getUserByEmail("mark@email.com")
  console.log(results);
  return results;
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>();
  const username = loaderData.users?.[0]?.username;
  const error = loaderData.error
  return (
    <>
    <div>{username ? username : "No username"}</div>
    <div>{error ? error : "No error"}</div>
    </>
  )
}
