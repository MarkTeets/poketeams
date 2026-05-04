import { db } from "./db";
import { usersTable } from "./schemas/app_user";
import {
  trainersTable,
  pokemonTable,
  pcBoxesTable,
  pokemonToPcBoxTable,
  teamsTable,
  pokemonToTeamTable,
} from "./schemas/trainer";

async function main() {
  // Delete in reverse FK order so constraints don't fire
  await db.delete(pokemonToTeamTable);
  await db.delete(pokemonToPcBoxTable);
  await db.delete(teamsTable);
  await db.delete(pcBoxesTable);
  await db.delete(pokemonTable);
  await db.delete(trainersTable);
  await db.delete(usersTable);

  // ---- usersTable ----
  const insertedUsers = await db
    .insert(usersTable)
    .values([
      { username: "Mark", email: "mark@email.com", password: "changeMe" },
      { username: "Jeff", email: "jeff@email.com", password: "changeMe" },
    ])
    .returning();

  const [mark, jeff] = insertedUsers;

  // ---- trainersTable ----
  const insertedTrainers = await db
    .insert(trainersTable)
    .values([
      { userId: mark.userId, trainerName: "Red", idNo: 54321 },
      { userId: jeff.userId, trainerName: "Blue", idNo: 12345 },
    ])
    .returning();

  const [red, blue] = insertedTrainers;

  // ---- pokemonTable ----
  const insertedPokemon = await db
    .insert(pokemonTable)
    .values([
      {
        pokeApiId: 25,
        name: "Pikachu",
        nickname: "Sparky",
        ability: "Static",
        level: 50,
        gender: "male",
        shiny: false,
        teraType: "Electric",
        move1: "Thunderbolt",
        move2: "Iron Tail",
        move3: "Quick Attack",
        move4: "Volt Tackle",
        ivHp: 31,
        ivAttack: 31,
        ivDefense: 31,
        ivSpecialAttack: 31,
        ivSpecialDefense: 31,
        ivSpeed: 31,
        evHp: 0,
        evAttack: 0,
        evDefense: 0,
        evSpecialAttack: 252,
        evSpecialDefense: 4,
        evSpeed: 252,
      },
      {
        pokeApiId: 6,
        name: "Charizard",
        nickname: "Blaze",
        ability: "Blaze",
        level: 100,
        gender: "male",
        shiny: false,
        teraType: "Fire",
        move1: "Flamethrower",
        move2: "Air Slash",
        move3: "Dragon Pulse",
        move4: "Solar Beam",
        ivHp: 31,
        ivAttack: 31,
        ivDefense: 31,
        ivSpecialAttack: 31,
        ivSpecialDefense: 31,
        ivSpeed: 31,
        evHp: 4,
        evAttack: 0,
        evDefense: 0,
        evSpecialAttack: 252,
        evSpecialDefense: 0,
        evSpeed: 252,
      },
      {
        pokeApiId: 150,
        name: "Mewtwo",
        ability: "Pressure",
        level: 100,
        gender: "genderless",
        shiny: true,
        teraType: "Psychic",
        move1: "Psystrike",
        move2: "Shadow Ball",
        move3: "Ice Beam",
        move4: "Aura Sphere",
        ivHp: 31,
        ivAttack: 31,
        ivDefense: 31,
        ivSpecialAttack: 31,
        ivSpecialDefense: 31,
        ivSpeed: 31,
        evHp: 4,
        evAttack: 0,
        evDefense: 0,
        evSpecialAttack: 252,
        evSpecialDefense: 0,
        evSpeed: 252,
      },
      {
        pokeApiId: 149,
        name: "Dragonite",
        nickname: "Drake",
        ability: "Multiscale",
        level: 100,
        gender: "male",
        shiny: false,
        teraType: "Normal",
        move1: "Extreme Speed",
        move2: "Dragon Dance",
        move3: "Outrage",
        move4: "Fire Punch",
        ivHp: 31,
        ivAttack: 31,
        ivDefense: 31,
        ivSpecialAttack: 31,
        ivSpecialDefense: 31,
        ivSpeed: 31,
        evHp: 4,
        evAttack: 252,
        evDefense: 0,
        evSpecialAttack: 0,
        evSpecialDefense: 0,
        evSpeed: 252,
      },
      {
        pokeApiId: 59,
        name: "Arcanine",
        ability: "Intimidate",
        level: 85,
        gender: "male",
        shiny: false,
        teraType: "Fire",
        move1: "Flare Blitz",
        move2: "Extreme Speed",
        move3: "Wild Charge",
        move4: "Close Combat",
        ivHp: 31,
        ivAttack: 31,
        ivDefense: 31,
        ivSpecialAttack: 31,
        ivSpecialDefense: 31,
        ivSpeed: 31,
        evHp: 0,
        evAttack: 252,
        evDefense: 4,
        evSpecialAttack: 0,
        evSpecialDefense: 0,
        evSpeed: 252,
      },
      {
        pokeApiId: 131,
        name: "Lapras",
        ability: "Water Absorb",
        level: 80,
        gender: "female",
        shiny: false,
        teraType: "Water",
        move1: "Surf",
        move2: "Ice Beam",
        move3: "Thunderbolt",
        move4: "Psychic",
        ivHp: 31,
        ivAttack: 31,
        ivDefense: 31,
        ivSpecialAttack: 31,
        ivSpecialDefense: 31,
        ivSpeed: 31,
        evHp: 252,
        evAttack: 0,
        evDefense: 4,
        evSpecialAttack: 252,
        evSpecialDefense: 0,
        evSpeed: 0,
      },
    ])
    .returning();

  const [sparky, charizard, mewtwo, dragonite, arcanine, lapras] =
    insertedPokemon;

  // ---- pc_boxes ----
  const insertedBoxes = await db
    .insert(pcBoxesTable)
    .values([
      { trainerId: red.trainerId, boxName: "Legendaries", boxOrder: 1 },
      { trainerId: red.trainerId, boxName: "Favorites", boxOrder: 2 },
      { trainerId: blue.trainerId, boxName: "Battle Ready", boxOrder: 1 },
    ])
    .returning();

  const [legendsBox, favoritesBox, blueBox] = insertedBoxes;

  // ---- pokemon_to_pc_box ----
  await db.insert(pokemonToPcBoxTable).values([
    { pokemonId: mewtwo.pokemonId, pcBoxId: legendsBox.pcBoxId },
    { pokemonId: sparky.pokemonId, pcBoxId: favoritesBox.pcBoxId },
    { pokemonId: charizard.pokemonId, pcBoxId: favoritesBox.pcBoxId },
    { pokemonId: arcanine.pokemonId, pcBoxId: blueBox.pcBoxId },
    { pokemonId: lapras.pokemonId, pcBoxId: blueBox.pcBoxId },
  ]);

  // ---- teams ----
  const insertedTeams = await db
    .insert(teamsTable)
    .values([
      { trainerId: red.trainerId, teamName: "Champion Team", teamOrder: 1 },
      { trainerId: blue.trainerId, teamName: "Rival Team", teamOrder: 1 },
    ])
    .returning();

  const [redTeam, blueTeam] = insertedTeams;

  // ---- pokemon_to_team ----
  await db.insert(pokemonToTeamTable).values([
    { pokemonId: sparky.pokemonId, teamId: redTeam.teamId },
    { pokemonId: charizard.pokemonId, teamId: redTeam.teamId },
    { pokemonId: mewtwo.pokemonId, teamId: redTeam.teamId },
    { pokemonId: dragonite.pokemonId, teamId: redTeam.teamId },
    { pokemonId: arcanine.pokemonId, teamId: blueTeam.teamId },
    { pokemonId: lapras.pokemonId, teamId: blueTeam.teamId },
  ]);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$client.end();
  });
