import { useLoaderData } from "react-router";

import { getUserByEmail } from "../models/app_user.server";
const encodedSprite = encodeURIComponent(
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
);

export async function loader() {
  const result = await getUserByEmail("mar@email.com");
  if (!result.ok) {
    return { username: undefined, dbError: result.message };
  }
  if (!result.data) {
    return { username: undefined, dbError: "user not found" };
  }
  return { username: result.data.username, dbError: undefined };
}

export default function Home() {
  const { username, dbError } = useLoaderData<typeof loader>();
  return (
    <>
      <div>{username ?? "No username"}</div>
      <div>{dbError ?? "No error"}</div>
      <a href={`/bulb`}>bulb</a>
    </>
  );
}
