import { useLoaderData } from "react-router";

import { getUserByEmail } from "../models/app_user";
export function meta() {
  return [
    { title: "PokeTeams" },
    { name: "PokeTeams", content: "Gotta catch 'em all!" },
  ];
}

export async function loader() {
  const result = await getUserByEmail("mark@email.com");
  if (!result.ok) {
    return { username: undefined, dbError: result.message };
  }
  return { username: result.data[0]?.username, dbError: undefined };
}

export default function Home() {
  const { username, dbError } = useLoaderData<typeof loader>();
  return (
    <>
      <div>{username ?? "No username"}</div>
      <div>{dbError ?? "No error"}</div>
    </>
  );
}
