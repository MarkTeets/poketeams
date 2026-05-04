import type { Route } from "./+types/home";
import { db } from "../../database/db";
import { useLoaderData } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PokeTeams" },
    { name: "PokeTeams", content: "Gotta catch 'em all!" },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  const results = await db.query.usersTable.findMany({
    columns: {
      userId: true,
      username: true,
    },
  });

  const username = results[0].username
  if (typeof username !== "string") return null;
    
  return username;
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>();
  return <div>
    {loaderData ? loaderData : "connection failed"}
  </div>
}
