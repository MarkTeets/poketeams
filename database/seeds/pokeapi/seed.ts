import { execSync } from "child_process";
import { eq, sql } from "drizzle-orm";
import { promises as fsPromises } from "fs";
import * as path from "path";

import { db } from "../../db";
import { pokeapiSeedRunsTable } from "../../schemas/meta";
import {
  abilitiesTable,
  abilityEffectEntriesTable,
  abilityEffectHistoryTable,
  abilityFlavorTextsTable,
  abilityNamesTable,
} from "../../schemas/pokeapi/abilities";
import {
  berriesTable,
  berryFirmnessesTable,
  berryFirmnessNamesTable,
  berryFlavorNamesTable,
  berryFlavorPotenciesTable,
  berryFlavorsTable,
  contestEffectEffectEntriesTable,
  contestEffectFlavorTextsTable,
  contestEffectsTable,
  contestTypeNamesTable,
  contestTypesTable,
  superContestEffectFlavorTextsTable,
  superContestEffectsTable,
} from "../../schemas/pokeapi/berries-and-contests";
import {
  encounterConditionNamesTable,
  encounterConditionsTable,
  encounterConditionValueNamesTable,
  encounterConditionValuesTable,
  encounterMethodNamesTable,
  encounterMethodsTable,
  wildEncounterConditionValuesTable,
  wildEncountersTable,
} from "../../schemas/pokeapi/encounters";
import {
  evolutionTriggerNamesTable,
  evolutionTriggersTable,
  generationNamesTable,
  generationsTable,
  versionGroupMoveLearnMethodsTable,
  versionGroupRegionsTable,
  versionGroupsTable,
  versionNamesTable,
  versionsTable,
} from "../../schemas/pokeapi/generations";
import {
  itemAttributeDescriptionsTable,
  itemAttributeNamesTable,
  itemAttributesTable,
  itemCategoriesTable,
  itemCategoryNamesTable,
  itemEffectEntriesTable,
  itemFlavorTextsTable,
  itemFlingEffectEffectEntriesTable,
  itemFlingEffectsTable,
  itemGameIndicesTable,
  itemItemAttributesTable,
  itemNamesTable,
  itemPocketNamesTable,
  itemPocketsTable,
  itemsTable,
} from "../../schemas/pokeapi/items";
import {
  languageNamesTable,
  languagesTable,
} from "../../schemas/pokeapi/languages";
import { machinesTable } from "../../schemas/pokeapi/machines";
import {
  moveAilmentNamesTable,
  moveAilmentsTable,
  moveBattleStyleNamesTable,
  moveBattleStylesTable,
  moveCategoriesTable,
  moveCategoryDescriptionsTable,
  moveDamageClassDescriptionsTable,
  moveDamageClassesTable,
  moveDamageClassNamesTable,
  moveLearnMethodDescriptionsTable,
  moveLearnMethodNamesTable,
  moveLearnMethodsTable,
  moveTargetDescriptionsTable,
  moveTargetNamesTable,
  moveTargetsTable,
} from "../../schemas/pokeapi/move-basics";
import {
  moveContestCombosTable,
  moveEffectEntriesTable,
  moveEffectHistoryTable,
  moveFlavorTextsTable,
  moveMetaTable,
  moveNamesTable,
  movesTable,
  moveStatChangesTable,
  moveValueHistoryEffectEntriesTable,
  moveValueHistoryTable,
} from "../../schemas/pokeapi/moves";
import {
  natureBattleStylePreferencesTable,
  natureNamesTable,
  naturePokeathlonStatChangesTable,
  naturesTable,
} from "../../schemas/pokeapi/natures";
import {
  pokedexDescriptionsTable,
  pokedexNamesTable,
  pokedexTable,
  pokedexVersionGroupsTable,
  pokemonSpeciesPokedexNumbersTable,
} from "../../schemas/pokeapi/pokedex";
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
} from "../../schemas/pokeapi/pokemon";
import {
  eggGroupNamesTable,
  eggGroupsTable,
  gendersTable,
  pokemonColorNamesTable,
  pokemonColorsTable,
  pokemonHabitatNamesTable,
  pokemonHabitatsTable,
  pokemonShapeAwesomeNamesTable,
  pokemonShapeNamesTable,
  pokemonShapesTable,
} from "../../schemas/pokeapi/pokemon-attributes";
import {
  pokemonFormFormNamesTable,
  pokemonFormNamesTable,
  pokemonFormsTable,
  pokemonFormTypesTable,
} from "../../schemas/pokeapi/pokemon-forms";
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
} from "../../schemas/pokeapi/pokemon-species";
import {
  growthRateDescriptionsTable,
  growthRateLevelsTable,
  growthRatesTable,
  locationAreaNamesTable,
  locationAreasTable,
  locationGameIndicesTable,
  locationNamesTable,
  locationsTable,
  palParkAreaNamesTable,
  palParkAreasTable,
  regionNamesTable,
  regionsTable,
  regionVersionGroupsTable,
} from "../../schemas/pokeapi/regions";
import {
  characteristicDescriptionsTable,
  characteristicsTable,
  pokeathlonStatNamesTable,
  pokeathlonStatsTable,
  statNamesTable,
  statsTable,
} from "../../schemas/pokeapi/stats";
import {
  typeEfficacyHistoryTable,
  typeEfficacyTable,
  typeGameIndicesTable,
  typeNamesTable,
  typesTable,
  typeSpritesTable,
} from "../../schemas/pokeapi/types";
import { logger } from "../../utils/db-logger";
import { cacheBase } from "./constants";

const CHUNK = 500;

// ──────────────────────────────────────────────
// Clear
// ──────────────────────────────────────────────

async function clearPokeApi(): Promise<void> {
  const rows = await db.execute<{ qualified: string }>(sql`
    SELECT format('%I.%I', table_schema, table_name) AS qualified
    FROM information_schema.tables
    WHERE table_schema = 'pokeapi'
      AND table_type = 'BASE TABLE'
  `);
  const tables = rows.rows.map((r) => r.qualified);
  if (tables.length === 0) return;
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`),
  );
  logger.info({ count: tables.length }, "pokeapi schema cleared");
}

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function idFromUrl(url: string | null | undefined): number | null {
  if (!url) return null;
  const id = parseInt(url.replace(/\/$/, "").split("/").pop()!);
  return isNaN(id) ? null : id;
}

async function readAllFromCache(endpoint: string): Promise<unknown[]> {
  const dir = path.join(cacheBase, endpoint);
  let entries: string[];
  try {
    entries = await fsPromises.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      logger.warn({ endpoint }, "Cache dir not found — skipping");
      return [];
    }
    throw err;
  }
  const results: unknown[] = [];
  for (const file of entries.filter(
    (f) => f.endsWith(".json") && !f.startsWith("__"),
  )) {
    const raw = await fsPromises.readFile(path.join(dir, file), "utf8");
    results.push(JSON.parse(raw));
  }
  return results;
}

async function insertChunked<T extends object>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db
      .insert(table)
      .values(rows.slice(i, i + CHUNK))
      .onConflictDoNothing();
  }
}

type NR = { name: string; language: { url: string } };
type DR = { description: string; language: { url: string } };
type FT = { flavor_text: string; language: { url: string } };

function langId(nr: NR): number {
  return idFromUrl(nr.language.url)!;
}

// ──────────────────────────────────────────────
// Wave 0 — language, move-ailment, move-battle-style, move-category
// ──────────────────────────────────────────────

async function seedLanguages() {
  type Lang = {
    id: number;
    name: string;
    official: boolean;
    iso639: string;
    iso3166: string;
    names: NR[];
  };
  const langs = (await readAllFromCache("language")) as Lang[];
  await insertChunked(
    languagesTable,
    langs.map((l) => ({
      languageId: l.id,
      name: l.name,
      official: l.official,
      iso639: l.iso639,
      iso3166: l.iso3166,
      url: `https://pokeapi.co/api/v2/language/${l.id}/`,
    })),
  );
  const names = langs.flatMap((l) =>
    l.names.map((n) => ({
      languageId: l.id,
      localLanguageId: langId(n),
      name: n.name,
    })),
  );
  await insertChunked(languageNamesTable, names);
  logger.info({ count: langs.length }, "languages seeded");
}

async function seedMoveAilments() {
  type MA = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("move-ailment")) as MA[];
  await insertChunked(
    moveAilmentsTable,
    rows.map((r) => ({
      moveAilmentId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/move-ailment/${r.id}/`,
    })),
  );
  await insertChunked(
    moveAilmentNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        moveAilmentId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "move-ailments seeded");
}

async function seedMoveBattleStyles() {
  type MBS = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("move-battle-style")) as MBS[];
  await insertChunked(
    moveBattleStylesTable,
    rows.map((r) => ({
      moveBattleStyleId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/move-battle-style/${r.id}/`,
    })),
  );
  await insertChunked(
    moveBattleStyleNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        moveBattleStyleId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "move-battle-styles seeded");
}

async function seedMoveCategories() {
  type MC = { id: number; name: string; descriptions: DR[] };
  const rows = (await readAllFromCache("move-category")) as MC[];
  await insertChunked(
    moveCategoriesTable,
    rows.map((r) => ({
      moveCategoryId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/move-category/${r.id}/`,
    })),
  );
  await insertChunked(
    moveCategoryDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        moveCategoryId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  logger.info({ count: rows.length }, "move-categories seeded");
}

// ──────────────────────────────────────────────
// Wave 1
// ──────────────────────────────────────────────

async function seedMoveDamageClasses() {
  type MDC = { id: number; name: string; names: NR[]; descriptions: DR[] };
  const rows = (await readAllFromCache("move-damage-class")) as MDC[];
  await insertChunked(
    moveDamageClassesTable,
    rows.map((r) => ({
      moveDamageClassId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/move-damage-class/${r.id}/`,
    })),
  );
  await insertChunked(
    moveDamageClassNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        moveDamageClassId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    moveDamageClassDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        moveDamageClassId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  logger.info({ count: rows.length }, "move-damage-classes seeded");
}

async function seedStats() {
  type Stat = {
    id: number;
    name: string;
    game_index: number;
    is_battle_only: boolean;
    move_damage_class: { url: string } | null;
    names: NR[];
  };
  const rows = (await readAllFromCache("stat")) as Stat[];
  await insertChunked(
    statsTable,
    rows.map((r) => ({
      statId: r.id,
      name: r.name,
      gameIndex: r.game_index,
      isBattleOnly: r.is_battle_only,
      moveDamageClassId: idFromUrl(r.move_damage_class?.url),
      url: `https://pokeapi.co/api/v2/stat/${r.id}/`,
    })),
  );
  await insertChunked(
    statNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        statId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "stats seeded");
}

async function seedBerryFirmnesses() {
  type BF = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("berry-firmness")) as BF[];
  await insertChunked(
    berryFirmnessesTable,
    rows.map((r) => ({
      berryFirmnessId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/berry-firmness/${r.id}/`,
    })),
  );
  await insertChunked(
    berryFirmnessNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        berryFirmnessId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "berry-firmnesses seeded");
}

async function seedPokeathlonStats() {
  type PS = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("pokeathlon-stat")) as PS[];
  await insertChunked(
    pokeathlonStatsTable,
    rows.map((r) => ({
      pokeathlonStatId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/pokeathlon-stat/${r.id}/`,
    })),
  );
  await insertChunked(
    pokeathlonStatNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokeathlonStatId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokeathlon-stats seeded");
}

async function seedPokemonColors() {
  type PC = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("pokemon-color")) as PC[];
  await insertChunked(
    pokemonColorsTable,
    rows.map((r) => ({
      pokemonColorId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/pokemon-color/${r.id}/`,
    })),
  );
  await insertChunked(
    pokemonColorNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokemonColorId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokemon-colors seeded");
}

async function seedPokemonHabitats() {
  type PH = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("pokemon-habitat")) as PH[];
  await insertChunked(
    pokemonHabitatsTable,
    rows.map((r) => ({
      pokemonHabitatId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/pokemon-habitat/${r.id}/`,
    })),
  );
  await insertChunked(
    pokemonHabitatNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokemonHabitatId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokemon-habitats seeded");
}

async function seedPokemonShapes() {
  type AwesomeName = { awesome_name: string; language: { url: string } };
  type PS = {
    id: number;
    name: string;
    names: NR[];
    awesome_names: AwesomeName[];
  };
  const rows = (await readAllFromCache("pokemon-shape")) as PS[];
  await insertChunked(
    pokemonShapesTable,
    rows.map((r) => ({
      pokemonShapeId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/pokemon-shape/${r.id}/`,
    })),
  );
  await insertChunked(
    pokemonShapeNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokemonShapeId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    pokemonShapeAwesomeNamesTable,
    rows.flatMap((r) =>
      r.awesome_names.map((a) => ({
        pokemonShapeId: r.id,
        localLanguageId: idFromUrl(a.language.url)!,
        awesomeName: a.awesome_name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokemon-shapes seeded");
}

async function seedEncounterMethods() {
  type EM = { id: number; name: string; order: number; names: NR[] };
  const rows = (await readAllFromCache("encounter-method")) as EM[];
  await insertChunked(
    encounterMethodsTable,
    rows.map((r) => ({
      encounterMethodId: r.id,
      name: r.name,
      order: r.order,
      url: `https://pokeapi.co/api/v2/encounter-method/${r.id}/`,
    })),
  );
  await insertChunked(
    encounterMethodNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        encounterMethodId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "encounter-methods seeded");
}

async function seedEvolutionTriggers() {
  type ET = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("evolution-trigger")) as ET[];
  await insertChunked(
    evolutionTriggersTable,
    rows.map((r) => ({
      evolutionTriggerId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/evolution-trigger/${r.id}/`,
    })),
  );
  await insertChunked(
    evolutionTriggerNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        evolutionTriggerId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "evolution-triggers seeded");
}

async function seedItemFlingEffects() {
  type IFE = {
    id: number;
    name: string;
    effect_entries: { effect: string; language: { url: string } }[];
  };
  const rows = (await readAllFromCache("item-fling-effect")) as IFE[];
  await insertChunked(
    itemFlingEffectsTable,
    rows.map((r) => ({
      itemFlingEffectId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/item-fling-effect/${r.id}/`,
    })),
  );
  await insertChunked(
    itemFlingEffectEffectEntriesTable,
    rows.flatMap((r) =>
      r.effect_entries.map((e) => ({
        itemFlingEffectId: r.id,
        localLanguageId: idFromUrl(e.language.url)!,
        effect: e.effect,
      })),
    ),
  );
  logger.info({ count: rows.length }, "item-fling-effects seeded");
}

async function seedItemPockets() {
  type IP = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("item-pocket")) as IP[];
  await insertChunked(
    itemPocketsTable,
    rows.map((r) => ({
      itemPocketId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/item-pocket/${r.id}/`,
    })),
  );
  await insertChunked(
    itemPocketNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        itemPocketId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "item-pockets seeded");
}

async function seedItemAttributes() {
  type IA = { id: number; name: string; names: NR[]; descriptions: DR[] };
  const rows = (await readAllFromCache("item-attribute")) as IA[];
  await insertChunked(
    itemAttributesTable,
    rows.map((r) => ({
      itemAttributeId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/item-attribute/${r.id}/`,
    })),
  );
  await insertChunked(
    itemAttributeNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        itemAttributeId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    itemAttributeDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        itemAttributeId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  logger.info({ count: rows.length }, "item-attributes seeded");
}

async function seedEggGroups() {
  type EG = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("egg-group")) as EG[];
  await insertChunked(
    eggGroupsTable,
    rows.map((r) => ({
      eggGroupId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/egg-group/${r.id}/`,
    })),
  );
  await insertChunked(
    eggGroupNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        eggGroupId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "egg-groups seeded");
}

async function seedGenders() {
  type G = { id: number; name: string };
  const rows = (await readAllFromCache("gender")) as G[];
  await insertChunked(
    gendersTable,
    rows.map((r) => ({
      genderId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/gender/${r.id}/`,
    })),
  );
  logger.info({ count: rows.length }, "genders seeded");
}

async function seedMoveLearnMethods() {
  type MLM = { id: number; name: string; names: NR[]; descriptions: DR[] };
  const rows = (await readAllFromCache("move-learn-method")) as MLM[];
  await insertChunked(
    moveLearnMethodsTable,
    rows.map((r) => ({
      moveLearnMethodId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/move-learn-method/${r.id}/`,
    })),
  );
  await insertChunked(
    moveLearnMethodNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        moveLearnMethodId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    moveLearnMethodDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        moveLearnMethodId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  logger.info({ count: rows.length }, "move-learn-methods seeded");
}

async function seedMoveTargets() {
  type MT = { id: number; name: string; names: NR[]; descriptions: DR[] };
  const rows = (await readAllFromCache("move-target")) as MT[];
  await insertChunked(
    moveTargetsTable,
    rows.map((r) => ({
      moveTargetId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/move-target/${r.id}/`,
    })),
  );
  await insertChunked(
    moveTargetNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        moveTargetId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    moveTargetDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        moveTargetId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  logger.info({ count: rows.length }, "move-targets seeded");
}

async function seedSuperContestEffects() {
  type SCE = { id: number; appeal: number; flavor_text_entries: FT[] };
  const rows = (await readAllFromCache("super-contest-effect")) as SCE[];
  await insertChunked(
    superContestEffectsTable,
    rows.map((r) => ({
      superContestEffectId: r.id,
      appeal: r.appeal,
      url: `https://pokeapi.co/api/v2/super-contest-effect/${r.id}/`,
    })),
  );
  await insertChunked(
    superContestEffectFlavorTextsTable,
    rows.flatMap((r) =>
      r.flavor_text_entries.map((f) => ({
        superContestEffectId: r.id,
        localLanguageId: idFromUrl(f.language.url)!,
        flavorText: f.flavor_text,
      })),
    ),
  );
  logger.info({ count: rows.length }, "super-contest-effects seeded");
}

async function seedContestEffects() {
  type CE = {
    id: number;
    appeal: number;
    jam: number;
    effect_entries: { effect: string; language: { url: string } }[];
    flavor_text_entries: FT[];
  };
  const rows = (await readAllFromCache("contest-effect")) as CE[];
  await insertChunked(
    contestEffectsTable,
    rows.map((r) => ({
      contestEffectId: r.id,
      appeal: r.appeal,
      jam: r.jam,
      url: `https://pokeapi.co/api/v2/contest-effect/${r.id}/`,
    })),
  );
  await insertChunked(
    contestEffectEffectEntriesTable,
    rows.flatMap((r) =>
      r.effect_entries.map((e) => ({
        contestEffectId: r.id,
        localLanguageId: idFromUrl(e.language.url)!,
        effect: e.effect,
      })),
    ),
  );
  await insertChunked(
    contestEffectFlavorTextsTable,
    rows.flatMap((r) =>
      r.flavor_text_entries.map((f) => ({
        contestEffectId: r.id,
        localLanguageId: idFromUrl(f.language.url)!,
        flavorText: f.flavor_text,
      })),
    ),
  );
  logger.info({ count: rows.length }, "contest-effects seeded");
}

// ──────────────────────────────────────────────
// Wave 2
// ──────────────────────────────────────────────

async function seedContestTypes() {
  // Seed without berryFlavorId — backfilled in wave 8
  type CTName = { name: string; color: string; language: { url: string } };
  type CT = { id: number; name: string; names: CTName[] };
  const rows = (await readAllFromCache("contest-type")) as CT[];
  await insertChunked(
    contestTypesTable,
    rows.map((r) => ({
      contestTypeId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/contest-type/${r.id}/`,
      berryFlavorId: null,
    })),
  );
  await insertChunked(
    contestTypeNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        contestTypeId: r.id,
        localLanguageId: idFromUrl(n.language.url)!,
        name: n.name,
        color: n.color,
      })),
    ),
  );
  logger.info({ count: rows.length }, "contest-types seeded");
}

async function seedBerryFlavors() {
  type BFl = {
    id: number;
    name: string;
    contest_type: { url: string };
    names: NR[];
  };
  const rows = (await readAllFromCache("berry-flavor")) as BFl[];
  await insertChunked(
    berryFlavorsTable,
    rows.map((r) => ({
      berryFlavorId: r.id,
      name: r.name,
      contestTypeId: idFromUrl(r.contest_type.url)!,
      url: `https://pokeapi.co/api/v2/berry-flavor/${r.id}/`,
    })),
  );
  await insertChunked(
    berryFlavorNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        berryFlavorId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "berry-flavors seeded");
}

async function seedRegions() {
  type Reg = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("region")) as Reg[];
  await insertChunked(
    regionsTable,
    rows.map((r) => ({
      regionId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/region/${r.id}/`,
    })),
  );
  await insertChunked(
    regionNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        regionId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "regions seeded");
}

async function seedPalParkAreas() {
  type PPA = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("pal-park-area")) as PPA[];
  await insertChunked(
    palParkAreasTable,
    rows.map((r) => ({
      palParkAreaId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/pal-park-area/${r.id}/`,
    })),
  );
  await insertChunked(
    palParkAreaNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        palParkAreaId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pal-park-areas seeded");
}

async function seedGrowthRates() {
  type GR = {
    id: number;
    name: string;
    formula: string;
    descriptions: DR[];
    levels: { level: number; experience: number }[];
  };
  const rows = (await readAllFromCache("growth-rate")) as GR[];
  await insertChunked(
    growthRatesTable,
    rows.map((r) => ({
      growthRateId: r.id,
      name: r.name,
      formula: r.formula,
      url: `https://pokeapi.co/api/v2/growth-rate/${r.id}/`,
    })),
  );
  await insertChunked(
    growthRateDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        growthRateId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  await insertChunked(
    growthRateLevelsTable,
    rows.flatMap((r) =>
      r.levels.map((l) => ({
        growthRateId: r.id,
        level: l.level,
        experience: l.experience,
      })),
    ),
  );
  logger.info({ count: rows.length }, "growth-rates seeded");
}

// ──────────────────────────────────────────────
// Wave 3
// ──────────────────────────────────────────────

async function seedGenerations() {
  type Gen = {
    id: number;
    name: string;
    main_region: { url: string } | null;
    names: NR[];
  };
  const rows = (await readAllFromCache("generation")) as Gen[];
  await insertChunked(
    generationsTable,
    rows.map((r) => ({
      generationId: r.id,
      name: r.name,
      mainRegionId: idFromUrl(r.main_region?.url),
      url: `https://pokeapi.co/api/v2/generation/${r.id}/`,
    })),
  );
  await insertChunked(
    generationNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        generationId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "generations seeded");
}

async function seedEncounterConditions() {
  type EC = { id: number; name: string; names: NR[] };
  const rows = (await readAllFromCache("encounter-condition")) as EC[];
  await insertChunked(
    encounterConditionsTable,
    rows.map((r) => ({
      encounterConditionId: r.id,
      name: r.name,
      url: `https://pokeapi.co/api/v2/encounter-condition/${r.id}/`,
    })),
  );
  await insertChunked(
    encounterConditionNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        encounterConditionId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "encounter-conditions seeded");
}

// ──────────────────────────────────────────────
// Wave 4
// ──────────────────────────────────────────────

async function seedVersionGroups() {
  type VG = {
    id: number;
    name: string;
    order: number;
    generation: { url: string };
    move_learn_methods: { url: string }[];
    regions: { url: string }[];
  };
  const rows = (await readAllFromCache("version-group")) as VG[];
  await insertChunked(
    versionGroupsTable,
    rows.map((r) => ({
      versionGroupId: r.id,
      name: r.name,
      order: r.order,
      generationId: idFromUrl(r.generation.url)!,
      url: `https://pokeapi.co/api/v2/version-group/${r.id}/`,
    })),
  );
  await insertChunked(
    versionGroupMoveLearnMethodsTable,
    rows.flatMap((r) =>
      r.move_learn_methods.map((m) => ({
        versionGroupId: r.id,
        moveLearnMethodId: idFromUrl(m.url)!,
      })),
    ),
  );
  await insertChunked(
    versionGroupRegionsTable,
    rows.flatMap((r) =>
      r.regions.map((reg) => ({
        versionGroupId: r.id,
        regionId: idFromUrl(reg.url)!,
      })),
    ),
  );
  logger.info({ count: rows.length }, "version-groups seeded");
}

async function seedVersions() {
  type V = {
    id: number;
    name: string;
    version_group: { url: string };
    names: NR[];
  };
  const rows = (await readAllFromCache("version")) as V[];
  await insertChunked(
    versionsTable,
    rows.map((r) => ({
      versionId: r.id,
      name: r.name,
      versionGroupId: idFromUrl(r.version_group.url)!,
      url: `https://pokeapi.co/api/v2/version/${r.id}/`,
    })),
  );
  await insertChunked(
    versionNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        versionId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "versions seeded");
}

async function seedEncounterConditionValues() {
  type ECV = {
    id: number;
    name: string;
    condition: { url: string };
    names: NR[];
  };
  const rows = (await readAllFromCache("encounter-condition-value")) as ECV[];
  await insertChunked(
    encounterConditionValuesTable,
    rows.map((r) => ({
      encounterConditionValueId: r.id,
      name: r.name,
      encounterConditionId: idFromUrl(r.condition.url)!,
      url: `https://pokeapi.co/api/v2/encounter-condition-value/${r.id}/`,
    })),
  );
  await insertChunked(
    encounterConditionValueNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        encounterConditionValueId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "encounter-condition-values seeded");
}

async function seedCharacteristics() {
  type Char = {
    id: number;
    gene_modulo: number;
    possible_values: number[];
    highest_stat: { url: string };
    descriptions: DR[];
  };
  const rows = (await readAllFromCache("characteristic")) as Char[];
  await insertChunked(
    characteristicsTable,
    rows.map((r) => ({
      characteristicId: r.id,
      geneModulo: r.gene_modulo,
      highestStatId: idFromUrl(r.highest_stat.url)!,
      url: `https://pokeapi.co/api/v2/characteristic/${r.id}/`,
    })),
  );
  await insertChunked(
    characteristicDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        characteristicId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  logger.info({ count: rows.length }, "characteristics seeded");
}

async function seedTypes() {
  type DmgRelations = {
    double_damage_to: { url: string }[];
    half_damage_to: { url: string }[];
    no_damage_to: { url: string }[];
  };
  type T = {
    id: number;
    name: string;
    generation: { url: string } | null;
    move_damage_class: { url: string } | null;
    names: NR[];
    damage_relations: DmgRelations;
    game_indices: { game_index: number; generation: { url: string } }[];
  };
  const rows = (await readAllFromCache("type")) as T[];
  await insertChunked(
    typesTable,
    rows.map((r) => ({
      typeId: r.id,
      name: r.name,
      generationId: idFromUrl(r.generation?.url),
      moveDamageClassId: idFromUrl(r.move_damage_class?.url),
      url: `https://pokeapi.co/api/v2/type/${r.id}/`,
    })),
  );
  await insertChunked(
    typeNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        typeId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  // Seed non-neutral efficacy from each type's outgoing damage relations
  const efficacy: {
    attackingTypeId: number;
    defendingTypeId: number;
    damageFactor: number;
  }[] = [];
  for (const r of rows) {
    for (const t of r.damage_relations.double_damage_to) {
      efficacy.push({
        attackingTypeId: r.id,
        defendingTypeId: idFromUrl(t.url)!,
        damageFactor: 200,
      });
    }
    for (const t of r.damage_relations.half_damage_to) {
      efficacy.push({
        attackingTypeId: r.id,
        defendingTypeId: idFromUrl(t.url)!,
        damageFactor: 50,
      });
    }
    for (const t of r.damage_relations.no_damage_to) {
      efficacy.push({
        attackingTypeId: r.id,
        defendingTypeId: idFromUrl(t.url)!,
        damageFactor: 0,
      });
    }
  }
  await insertChunked(typeEfficacyTable, efficacy);
  await insertChunked(
    typeGameIndicesTable,
    rows.flatMap((r) =>
      r.game_indices.map((g) => ({
        typeId: r.id,
        generationId: idFromUrl(g.generation.url)!,
        gameIndex: g.game_index,
      })),
    ),
  );
  logger.info({ count: rows.length }, "types seeded");
}

async function seedNatures() {
  type Nature = {
    id: number;
    name: string;
    decreased_stat: { url: string } | null;
    increased_stat: { url: string } | null;
    hates_flavor: { url: string } | null;
    likes_flavor: { url: string } | null;
    names: NR[];
    pokeathlon_stat_changes: {
      max_change: number;
      pokeathlon_stat: { url: string };
    }[];
    move_battle_style_preferences: {
      low_hp_preference: number;
      high_hp_preference: number;
      move_battle_style: { url: string };
    }[];
  };
  const rows = (await readAllFromCache("nature")) as Nature[];
  await insertChunked(
    naturesTable,
    rows.map((r) => ({
      natureId: r.id,
      name: r.name,
      decreasedStatId: idFromUrl(r.decreased_stat?.url),
      increasedStatId: idFromUrl(r.increased_stat?.url),
      hatesFlavorId: idFromUrl(r.hates_flavor?.url),
      likesFlavorId: idFromUrl(r.likes_flavor?.url),
      url: `https://pokeapi.co/api/v2/nature/${r.id}/`,
    })),
  );
  await insertChunked(
    natureNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        natureId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    naturePokeathlonStatChangesTable,
    rows.flatMap((r) =>
      r.pokeathlon_stat_changes.map((c) => ({
        natureId: r.id,
        pokeathlonStatId: idFromUrl(c.pokeathlon_stat.url)!,
        maxChange: c.max_change,
      })),
    ),
  );
  await insertChunked(
    natureBattleStylePreferencesTable,
    rows.flatMap((r) =>
      r.move_battle_style_preferences.map((p) => ({
        natureId: r.id,
        moveBattleStyleId: idFromUrl(p.move_battle_style.url)!,
        lowHpPreference: p.low_hp_preference,
        highHpPreference: p.high_hp_preference,
      })),
    ),
  );
  logger.info({ count: rows.length }, "natures seeded");
}

// ──────────────────────────────────────────────
// Wave 5
// ──────────────────────────────────────────────

async function seedItemCategories() {
  type IC = { id: number; name: string; pocket: { url: string }; names: NR[] };
  const rows = (await readAllFromCache("item-category")) as IC[];
  await insertChunked(
    itemCategoriesTable,
    rows.map((r) => ({
      itemCategoryId: r.id,
      name: r.name,
      itemPocketId: idFromUrl(r.pocket.url)!,
      url: `https://pokeapi.co/api/v2/item-category/${r.id}/`,
    })),
  );
  await insertChunked(
    itemCategoryNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        itemCategoryId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "item-categories seeded");
}

async function seedLocations() {
  type Loc = {
    id: number;
    name: string;
    region: { url: string } | null;
    names: NR[];
    game_indices: { game_index: number; generation: { url: string } }[];
  };
  const rows = (await readAllFromCache("location")) as Loc[];
  await insertChunked(
    locationsTable,
    rows.map((r) => ({
      locationId: r.id,
      name: r.name,
      regionId: idFromUrl(r.region?.url),
      url: `https://pokeapi.co/api/v2/location/${r.id}/`,
    })),
  );
  await insertChunked(
    locationNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        locationId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    locationGameIndicesTable,
    rows.flatMap((r) =>
      (r.game_indices ?? []).map((g) => ({
        locationId: r.id,
        generationId: idFromUrl(g.generation.url)!,
        gameIndex: g.game_index,
      })),
    ),
  );
  logger.info({ count: rows.length }, "locations seeded");
}

async function seedAbilities() {
  type Ability = {
    id: number;
    name: string;
    is_main_series: boolean;
    generation: { url: string } | null;
    names: NR[];
    effect_entries: {
      effect: string;
      short_effect: string;
      language: { url: string };
    }[];
    flavor_text_entries: {
      flavor_text: string;
      language: { url: string };
      version_group: { url: string };
    }[];
  };
  const rows = (await readAllFromCache("ability")) as Ability[];
  await insertChunked(
    abilitiesTable,
    rows.map((r) => ({
      abilityId: r.id,
      name: r.name,
      isMainSeries: r.is_main_series,
      generationId: idFromUrl(r.generation?.url),
      url: `https://pokeapi.co/api/v2/ability/${r.id}/`,
    })),
  );
  await insertChunked(
    abilityNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        abilityId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    abilityEffectEntriesTable,
    rows.flatMap((r) =>
      r.effect_entries.map((e) => ({
        abilityId: r.id,
        localLanguageId: idFromUrl(e.language.url)!,
        effect: e.effect,
        shortEffect: e.short_effect,
      })),
    ),
  );
  await insertChunked(
    abilityFlavorTextsTable,
    rows.flatMap((r) =>
      r.flavor_text_entries.map((f) => ({
        abilityId: r.id,
        localLanguageId: idFromUrl(f.language.url)!,
        versionGroupId: idFromUrl(f.version_group.url)!,
        flavorText: f.flavor_text,
      })),
    ),
  );
  logger.info({ count: rows.length }, "abilities seeded");
}

async function seedMoves() {
  type Move = {
    id: number;
    name: string;
    accuracy: number | null;
    effect_chance: number | null;
    pp: number | null;
    priority: number;
    power: number | null;
    damage_class: { url: string };
    type: { url: string };
    target: { url: string };
    generation: { url: string } | null;
    contest_type: { url: string } | null;
    contest_effect: { url: string } | null;
    super_contest_effect: { url: string } | null;
    names: NR[];
    effect_entries: {
      effect: string;
      short_effect: string;
      language: { url: string };
    }[];
    flavor_text_entries: {
      flavor_text: string;
      language: { url: string };
      version_group: { url: string };
    }[];
    meta: {
      ailment: { url: string };
      category: { url: string };
      min_hits: number | null;
      max_hits: number | null;
      min_turns: number | null;
      max_turns: number | null;
      drain: number;
      healing: number;
      crit_rate: number;
      ailment_chance: number;
      flinch_chance: number;
      stat_chance: number;
    } | null;
    stat_changes: { change: number; stat: { url: string } }[];
  };
  const rows = (await readAllFromCache("move")) as Move[];
  await insertChunked(
    movesTable,
    rows.map((r) => ({
      moveId: r.id,
      name: r.name,
      accuracy: r.accuracy,
      effectChance: r.effect_chance,
      pp: r.pp,
      priority: r.priority,
      power: r.power,
      moveDamageClassId: idFromUrl(r.damage_class.url)!,
      typeId: idFromUrl(r.type.url)!,
      moveTargetId: idFromUrl(r.target.url)!,
      generationId: idFromUrl(r.generation?.url),
      contestTypeId: idFromUrl(r.contest_type?.url),
      contestEffectId: idFromUrl(r.contest_effect?.url),
      superContestEffectId: idFromUrl(r.super_contest_effect?.url),
      url: `https://pokeapi.co/api/v2/move/${r.id}/`,
    })),
  );
  await insertChunked(
    moveNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        moveId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    moveEffectEntriesTable,
    rows.flatMap((r) =>
      r.effect_entries.map((e) => ({
        moveId: r.id,
        localLanguageId: idFromUrl(e.language.url)!,
        effect: e.effect,
        shortEffect: e.short_effect,
      })),
    ),
  );
  await insertChunked(
    moveFlavorTextsTable,
    rows.flatMap((r) =>
      r.flavor_text_entries.map((f) => ({
        moveId: r.id,
        localLanguageId: idFromUrl(f.language.url)!,
        versionGroupId: idFromUrl(f.version_group.url)!,
        flavorText: f.flavor_text,
      })),
    ),
  );
  const metaRows = rows
    .filter((r) => r.meta !== null)
    .map((r) => ({
      moveId: r.id,
      moveAilmentId: idFromUrl(r.meta!.ailment.url)!,
      moveCategoryId: idFromUrl(r.meta!.category.url)!,
      minHits: r.meta!.min_hits,
      maxHits: r.meta!.max_hits,
      minTurns: r.meta!.min_turns,
      maxTurns: r.meta!.max_turns,
      drain: r.meta!.drain,
      healing: r.meta!.healing,
      critRate: r.meta!.crit_rate,
      ailmentChance: r.meta!.ailment_chance,
      flinchChance: r.meta!.flinch_chance,
      statChance: r.meta!.stat_chance,
    }));
  await insertChunked(moveMetaTable, metaRows);
  await insertChunked(
    moveStatChangesTable,
    rows.flatMap((r) =>
      r.stat_changes.map((c) => ({
        moveId: r.id,
        statId: idFromUrl(c.stat.url)!,
        change: c.change,
      })),
    ),
  );
  logger.info({ count: rows.length }, "moves seeded");
}

// ──────────────────────────────────────────────
// Wave 6
// ──────────────────────────────────────────────

async function seedItems() {
  type Item = {
    id: number;
    name: string;
    cost: number;
    fling_power: number | null;
    category: { url: string };
    fling_effect: { url: string } | null;
    sprites: { default: string | null } | null;
    names: NR[];
    effect_entries: {
      effect: string;
      short_effect: string;
      language: { url: string };
    }[];
    flavor_text_entries: {
      text: string;
      language: { url: string };
      version_group: { url: string };
    }[];
    attributes: { url: string }[];
    game_indices: { game_index: number; generation: { url: string } }[];
  };
  const rows = (await readAllFromCache("item")) as Item[];
  await insertChunked(
    itemsTable,
    rows.map((r) => ({
      itemId: r.id,
      name: r.name,
      cost: r.cost,
      flingPower: r.fling_power,
      spriteUrl: r.sprites?.default ?? null,
      itemCategoryId: idFromUrl(r.category.url)!,
      itemFlingEffectId: idFromUrl(r.fling_effect?.url),
      url: `https://pokeapi.co/api/v2/item/${r.id}/`,
    })),
  );
  await insertChunked(
    itemNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        itemId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    itemEffectEntriesTable,
    rows.flatMap((r) =>
      r.effect_entries.map((e) => ({
        itemId: r.id,
        localLanguageId: idFromUrl(e.language.url)!,
        effect: e.effect,
        shortEffect: e.short_effect,
      })),
    ),
  );
  await insertChunked(
    itemFlavorTextsTable,
    rows.flatMap((r) =>
      r.flavor_text_entries.map((f) => ({
        itemId: r.id,
        localLanguageId: idFromUrl(f.language.url)!,
        versionGroupId: idFromUrl(f.version_group.url)!,
        text: f.text,
      })),
    ),
  );
  await insertChunked(
    itemItemAttributesTable,
    rows.flatMap((r) =>
      r.attributes.map((a) => ({
        itemId: r.id,
        itemAttributeId: idFromUrl(a.url)!,
      })),
    ),
  );
  await insertChunked(
    itemGameIndicesTable,
    rows.flatMap((r) =>
      r.game_indices.map((g) => ({
        itemId: r.id,
        generationId: idFromUrl(g.generation.url)!,
        gameIndex: g.game_index,
      })),
    ),
  );
  logger.info({ count: rows.length }, "items seeded");
}

async function seedBerries() {
  type Berry = {
    id: number;
    name: string;
    growth_time: number;
    max_harvest: number;
    natural_gift_power: number;
    size: number;
    smoothness: number;
    soil_dryness: number;
    firmness: { url: string };
    item: { url: string } | null;
    natural_gift_type: { url: string } | null;
    flavors: { potency: number; flavor: { url: string } }[];
  };
  const rows = (await readAllFromCache("berry")) as Berry[];
  await insertChunked(
    berriesTable,
    rows.map((r) => ({
      berryId: r.id,
      name: r.name,
      growthTime: r.growth_time,
      maxHarvest: r.max_harvest,
      naturalGiftPower: r.natural_gift_power,
      size: r.size,
      smoothness: r.smoothness,
      soilDryness: r.soil_dryness,
      berryFirmnessId: idFromUrl(r.firmness.url)!,
      itemId: idFromUrl(r.item?.url),
      naturalGiftTypeId: idFromUrl(r.natural_gift_type?.url),
      url: `https://pokeapi.co/api/v2/berry/${r.id}/`,
    })),
  );
  await insertChunked(
    berryFlavorPotenciesTable,
    rows.flatMap((r) =>
      r.flavors.map((f) => ({
        berryId: r.id,
        berryFlavorId: idFromUrl(f.flavor.url)!,
        potency: f.potency,
      })),
    ),
  );
  logger.info({ count: rows.length }, "berries seeded");
}

async function seedLocationAreas() {
  type LA = {
    id: number;
    name: string;
    game_index: number;
    location: { url: string };
    names: NR[];
  };
  const rows = (await readAllFromCache("location-area")) as LA[];
  await insertChunked(
    locationAreasTable,
    rows.map((r) => ({
      locationAreaId: r.id,
      name: r.name,
      gameIndex: r.game_index,
      locationId: idFromUrl(r.location.url)!,
      url: `https://pokeapi.co/api/v2/location-area/${r.id}/`,
    })),
  );
  await insertChunked(
    locationAreaNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        locationAreaId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  logger.info({ count: rows.length }, "location-areas seeded");
}

// ──────────────────────────────────────────────
// Wave 7
// ──────────────────────────────────────────────

async function seedMachines() {
  type Machine = {
    id: number;
    item: { url: string };
    move: { url: string };
    version_group: { url: string };
  };
  const rows = (await readAllFromCache("machine")) as Machine[];
  await insertChunked(
    machinesTable,
    rows.map((r) => ({
      machineId: r.id,
      itemId: idFromUrl(r.item.url)!,
      moveId: idFromUrl(r.move.url)!,
      versionGroupId: idFromUrl(r.version_group.url)!,
      url: `https://pokeapi.co/api/v2/machine/${r.id}/`,
    })),
  );
  logger.info({ count: rows.length }, "machines seeded");
}

async function seedPokemonSpecies() {
  type Species = {
    id: number;
    name: string;
    order: number;
    gender_rate: number;
    capture_rate: number;
    base_happiness: number | null;
    is_baby: boolean;
    is_legendary: boolean;
    is_mythical: boolean;
    hatch_counter: number | null;
    has_gender_differences: boolean;
    forms_switchable: boolean;
    generation: { url: string };
    growth_rate: { url: string };
    color: { url: string };
    shape: { url: string } | null;
    habitat: { url: string } | null;
    evolves_from_species: { url: string } | null;
    evolution_chain: { url: string } | null;
    names: NR[];
    flavor_text_entries: {
      flavor_text: string;
      language: { url: string };
      version: { url: string };
    }[];
    genera: { genus: string; language: { url: string } }[];
    form_descriptions: { description: string; language: { url: string } }[];
    egg_groups: { url: string }[];
    pal_park_encounters: {
      base_score: number;
      rate: number;
      area: { url: string };
    }[];
  };
  const rows = (await readAllFromCache("pokemon-species")) as Species[];
  // Seed without evolutionChainId or evolvesFromSpeciesId — both backfilled
  // afterwards. evolvesFromSpeciesId is a self-FK; bulk insert order does not
  // guarantee the parent species exists before its children, so set null first.
  await insertChunked(
    pokemonSpeciesTable,
    rows.map((r) => ({
      pokemonSpeciesId: r.id,
      name: r.name,
      order: r.order,
      genderRate: r.gender_rate,
      captureRate: r.capture_rate,
      baseHappiness: r.base_happiness,
      isBaby: r.is_baby,
      isLegendary: r.is_legendary,
      isMythical: r.is_mythical,
      hatchCounter: r.hatch_counter,
      hasGenderDifferences: r.has_gender_differences,
      formsSwitchable: r.forms_switchable,
      generationId: idFromUrl(r.generation.url)!,
      growthRateId: idFromUrl(r.growth_rate.url)!,
      pokemonColorId: idFromUrl(r.color.url)!,
      pokemonShapeId: idFromUrl(r.shape?.url),
      pokemonHabitatId: idFromUrl(r.habitat?.url),
      evolvesFromSpeciesId: null,
      evolutionChainId: null,
      url: `https://pokeapi.co/api/v2/pokemon-species/${r.id}/`,
    })),
  );
  await insertChunked(
    pokemonSpeciesNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokemonSpeciesId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    pokemonSpeciesFlavorTextsTable,
    rows.flatMap((r) =>
      r.flavor_text_entries.map((f) => ({
        pokemonSpeciesId: r.id,
        localLanguageId: idFromUrl(f.language.url)!,
        versionId: idFromUrl(f.version.url)!,
        flavorText: f.flavor_text,
      })),
    ),
  );
  await insertChunked(
    pokemonSpeciesGeneraTable,
    rows.flatMap((r) =>
      r.genera.map((g) => ({
        pokemonSpeciesId: r.id,
        localLanguageId: idFromUrl(g.language.url)!,
        genus: g.genus,
      })),
    ),
  );
  await insertChunked(
    pokemonSpeciesFormDescriptionsTable,
    rows.flatMap((r) =>
      (r.form_descriptions ?? []).map((d) => ({
        pokemonSpeciesId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  await insertChunked(
    pokemonSpeciesEggGroupsTable,
    rows.flatMap((r) =>
      r.egg_groups.map((eg) => ({
        pokemonSpeciesId: r.id,
        eggGroupId: idFromUrl(eg.url)!,
      })),
    ),
  );
  await insertChunked(
    pokemonSpeciesPalParkEncountersTable,
    rows.flatMap((r) =>
      r.pal_park_encounters.map((e) => ({
        pokemonSpeciesId: r.id,
        palParkAreaId: idFromUrl(e.area.url)!,
        baseScore: e.base_score,
        rate: e.rate,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokemon-species seeded");
}

type ChainNode = {
  species: { name: string; url: string };
  evolution_details: {
    base_form: { name: string; url: string } | null;
    trigger: { url: string };
    item: { url: string } | null;
    held_item: { url: string } | null;
    known_move: { url: string } | null;
    known_move_type: { url: string } | null;
    used_move: { url: string } | null;
    location: { url: string } | null;
    party_species: { url: string } | null;
    party_type: { url: string } | null;
    trade_species: { url: string } | null;
    gender: number | null;
    region: { name: string; url: string } | null;
    min_level: number | null;
    min_happiness: number | null;
    min_beauty: number | null;
    min_affection: number | null;
    min_damage_taken: number | null;
    min_move_count: number | null;
    min_steps: number | null;
    time_of_day: string;
    relative_physical_stats: number | null;
    needs_overworld_rain: boolean;
    needs_multiplayer: boolean;
    turn_upside_down: boolean;
  }[];
  evolves_to: ChainNode[];
};

function collectEvolutions(
  chainId: number,
  node: ChainNode,
  pokemonNameMap: Map<string, number>,
  fromSpeciesId?: number,
  fromSpeciesName?: string,
): object[] {
  const rows: object[] = [];
  const currentSpeciesId = idFromUrl(node.species.url)!;
  const currentSpeciesName = node.species.name;
  for (const detail of node.evolution_details) {
    let evolveStartPokemonId: number | null =
      pokemonNameMap.get(fromSpeciesName ?? "") ?? null;
    if (detail.base_form) {
      evolveStartPokemonId = idFromUrl(detail.base_form.url) ?? null;
    }

    let evolveEndPokemonId: number | null =
      pokemonNameMap.get(currentSpeciesName) ?? null;
    if (detail.base_form) {
      const suffix = detail.base_form.name.slice(
        detail.base_form.name.lastIndexOf("-"),
      );
      evolveEndPokemonId =
        pokemonNameMap.get(currentSpeciesName + suffix) ?? evolveEndPokemonId;
    } else if (detail.region) {
      evolveEndPokemonId =
        pokemonNameMap.get(currentSpeciesName + "-" + detail.region.name) ??
        evolveEndPokemonId;
    }

    rows.push({
      evolutionChainId: chainId,
      evolveStartSpeciesId: fromSpeciesId,
      evolveStartPokemonId,
      evolveEndSpeciesId: currentSpeciesId,
      evolveEndPokemonId,
      baseForm: detail.base_form?.name ?? null,
      triggerId: idFromUrl(detail.trigger.url)!,
      itemId: idFromUrl(detail.item?.url),
      heldItemId: idFromUrl(detail.held_item?.url),
      knownMoveId: idFromUrl(detail.known_move?.url),
      knownMoveTypeId: idFromUrl(detail.known_move_type?.url),
      usedMoveId: idFromUrl(detail.used_move?.url),
      locationId: idFromUrl(detail.location?.url),
      partySpeciesId: idFromUrl(detail.party_species?.url),
      partyTypeId: idFromUrl(detail.party_type?.url),
      tradeSpeciesId: idFromUrl(detail.trade_species?.url),
      regionId: idFromUrl(detail.region?.url),
      genderId: detail.gender,
      minLevel: detail.min_level,
      minHappiness: detail.min_happiness,
      minBeauty: detail.min_beauty,
      minAffection: detail.min_affection,
      minDamageTaken: detail.min_damage_taken,
      minMoveCount: detail.min_move_count,
      minSteps: detail.min_steps,
      timeOfDay: detail.time_of_day || null,
      relativePhysicalStats: detail.relative_physical_stats,
      needsOverworldRain: detail.needs_overworld_rain ?? false,
      needsMultiplayer: detail.needs_multiplayer ?? false,
      turnUpsideDown: detail.turn_upside_down ?? false,
    });
  }
  for (const child of node.evolves_to) {
    rows.push(
      ...collectEvolutions(
        chainId,
        child,
        pokemonNameMap,
        currentSpeciesId,
        currentSpeciesName,
      ),
    );
  }
  return rows;
}

async function seedEvolutionChains() {
  type Chain = {
    id: number;
    baby_trigger_item: { url: string } | null;
    chain: ChainNode;
  };
  type Species = { varieties: { pokemon: { name: string; url: string } }[] };
  const speciesRows = (await readAllFromCache("pokemon-species")) as Species[];
  const pokemonNameMap = new Map<string, number>();
  for (const s of speciesRows) {
    for (const v of s.varieties) {
      const id = idFromUrl(v.pokemon.url);
      if (id !== null) pokemonNameMap.set(v.pokemon.name, id);
    }
  }

  const rows = (await readAllFromCache("evolution-chain")) as Chain[];
  await insertChunked(
    evolutionChainsTable,
    rows.map((r) => ({
      evolutionChainId: r.id,
      babyTriggerItemId: idFromUrl(r.baby_trigger_item?.url),
      url: `https://pokeapi.co/api/v2/evolution-chain/${r.id}/`,
    })),
  );
  const evolutions = rows.flatMap((r) =>
    collectEvolutions(r.id, r.chain, pokemonNameMap),
  );
  await insertChunked(pokemonSpeciesEvolutionsTable, evolutions);
  logger.info({ count: rows.length }, "evolution-chains seeded");
}

// ──────────────────────────────────────────────
// Wave 8
// ──────────────────────────────────────────────

async function seedPokedexes() {
  type Pokedex = {
    id: number;
    name: string;
    is_main_series: boolean;
    region: { url: string } | null;
    names: NR[];
    descriptions: DR[];
    version_groups: { url: string }[];
    pokemon_entries: {
      entry_number: number;
      pokemon_species: { url: string };
    }[];
  };
  const rows = (await readAllFromCache("pokedex")) as Pokedex[];
  await insertChunked(
    pokedexTable,
    rows.map((r) => ({
      pokedexId: r.id,
      name: r.name,
      isMainSeries: r.is_main_series,
      regionId: idFromUrl(r.region?.url),
      url: `https://pokeapi.co/api/v2/pokedex/${r.id}/`,
    })),
  );
  await insertChunked(
    pokedexNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokedexId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    pokedexDescriptionsTable,
    rows.flatMap((r) =>
      r.descriptions.map((d) => ({
        pokedexId: r.id,
        localLanguageId: idFromUrl(d.language.url)!,
        description: d.description,
      })),
    ),
  );
  await insertChunked(
    pokedexVersionGroupsTable,
    rows.flatMap((r) =>
      r.version_groups.map((vg) => ({
        pokedexId: r.id,
        versionGroupId: idFromUrl(vg.url)!,
      })),
    ),
  );
  await insertChunked(
    pokemonSpeciesPokedexNumbersTable,
    rows.flatMap((r) =>
      r.pokemon_entries.map((e) => ({
        pokemonSpeciesId: idFromUrl(e.pokemon_species.url)!,
        pokedexId: r.id,
        entryNumber: e.entry_number,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokedexes seeded");
}

type SpriteRow = {
  pokemonId: number;
  source: string;
  variant: string;
  url: string;
};

function flattenSprites(
  pokemonId: number,
  sprites: Record<string, unknown>,
): SpriteRow[] {
  const rows: SpriteRow[] = [];

  for (const [variant, val] of Object.entries(sprites)) {
    if (variant === "other" || variant === "versions") continue;
    if (typeof val === "string")
      rows.push({ pokemonId, source: "default", variant, url: val });
  }

  const other = sprites["other"] as
    | Record<string, Record<string, string | null>>
    | undefined;
  if (other) {
    for (const [source, variantMap] of Object.entries(other)) {
      for (const [variant, url] of Object.entries(variantMap)) {
        if (typeof url === "string")
          rows.push({ pokemonId, source, variant, url });
      }
    }
  }

  const versions = sprites["versions"] as
    | Record<string, Record<string, Record<string, unknown>>>
    | undefined;
  if (versions) {
    for (const gameMap of Object.values(versions)) {
      for (const [game, variantMap] of Object.entries(gameMap)) {
        for (const [variant, val] of Object.entries(variantMap)) {
          if (
            variant === "animated" &&
            typeof val === "object" &&
            val !== null
          ) {
            for (const [animVariant, url] of Object.entries(
              val as Record<string, string | null>,
            )) {
              if (typeof url === "string")
                rows.push({
                  pokemonId,
                  source: `${game}-animated`,
                  variant: animVariant,
                  url,
                });
            }
          } else if (typeof val === "string") {
            rows.push({ pokemonId, source: game, variant, url: val });
          }
        }
      }
    }
  }

  return rows;
}

async function seedPokemon() {
  type PastType = {
    generation: { url: string };
    types: { slot: number; type: { url: string } }[];
  };
  type PastAbility = {
    generation: { url: string };
    abilities: {
      is_hidden: boolean;
      slot: number;
      ability: { url: string } | null;
    }[];
  };
  type PastStat = {
    generation: { url: string };
    stats: { base_stat: number; effort: number; stat: { url: string } }[];
  };
  type Pokemon = {
    id: number;
    name: string;
    base_experience: number | null;
    height: number;
    weight: number;
    order: number;
    is_default: boolean;
    species: { url: string };
    cries: { latest: string | null; legacy: string | null } | null;
    abilities: { is_hidden: boolean; slot: number; ability: { url: string } }[];
    types: { slot: number; type: { url: string } }[];
    stats: { base_stat: number; effort: number; stat: { url: string } }[];
    moves: {
      move: { url: string };
      version_group_details: {
        level_learned_at: number;
        order: number | null;
        move_learn_method: { url: string };
        version_group: { url: string };
      }[];
    }[];
    game_indices: { game_index: number; version: { url: string } }[];
    held_items: {
      item: { url: string };
      version_details: { rarity: number; version: { url: string } }[];
    }[];
    past_types: PastType[] | undefined;
    past_abilities: PastAbility[] | undefined;
    past_stats: PastStat[] | undefined;
    sprites: Record<string, unknown>;
  };

  const files = await (async () => {
    const dir = path.join(cacheBase, "pokemon");
    const entries = await fsPromises.readdir(dir);
    return entries.filter((f) => f.endsWith(".json") && !f.startsWith("__"));
  })();

  logger.info(
    { count: files.length },
    "seeding pokemon (one-at-a-time for memory)",
  );

  for (const file of files) {
    const raw = await fsPromises.readFile(
      path.join(cacheBase, "pokemon", file),
      "utf8",
    );
    const p = JSON.parse(raw) as Pokemon;

    await db
      .insert(pokemonTable)
      .values({
        pokemonId: p.id,
        name: p.name,
        baseExperience: p.base_experience,
        height: p.height,
        weight: p.weight,
        order: p.order,
        isDefault: p.is_default,
        pokemonSpeciesId: idFromUrl(p.species.url)!,
        cryLatest: p.cries?.latest ?? null,
        cryLegacy: p.cries?.legacy ?? null,
        url: `https://pokeapi.co/api/v2/pokemon/${p.id}/`,
      })
      .onConflictDoNothing();

    await insertChunked(
      pokemonAbilitiesTable,
      p.abilities.map((a) => ({
        pokemonId: p.id,
        abilityId: idFromUrl(a.ability.url)!,
        isHidden: a.is_hidden,
        slot: a.slot,
      })),
    );
    await insertChunked(
      pokemonTypesTable,
      p.types.map((t) => ({
        pokemonId: p.id,
        typeId: idFromUrl(t.type.url)!,
        slot: t.slot,
      })),
    );
    await insertChunked(
      pokemonStatsTable,
      p.stats.map((s) => ({
        pokemonId: p.id,
        statId: idFromUrl(s.stat.url)!,
        baseStat: s.base_stat,
        effort: s.effort,
      })),
    );
    const moveRows = p.moves.flatMap((m) =>
      m.version_group_details.map((vgd) => ({
        pokemonId: p.id,
        moveId: idFromUrl(m.move.url)!,
        versionGroupId: idFromUrl(vgd.version_group.url)!,
        moveLearnMethodId: idFromUrl(vgd.move_learn_method.url)!,
        levelLearnedAt: vgd.level_learned_at,
        order: vgd.order ?? null,
      })),
    );
    await insertChunked(pokemonMovesTable, moveRows);
    await insertChunked(
      pokemonGameIndicesTable,
      p.game_indices.map((g) => ({
        pokemonId: p.id,
        versionId: idFromUrl(g.version.url)!,
        gameIndex: g.game_index,
      })),
    );
    await insertChunked(
      pokemonHeldItemsTable,
      p.held_items.flatMap((hi) =>
        hi.version_details.map((vd) => ({
          pokemonId: p.id,
          itemId: idFromUrl(hi.item.url)!,
          versionId: idFromUrl(vd.version.url)!,
          rarity: vd.rarity,
        })),
      ),
    );
    if (p.past_types) {
      await insertChunked(
        pokemonTypeHistoryTable,
        p.past_types.flatMap((pt) =>
          pt.types.map((t) => ({
            pokemonId: p.id,
            generationId: idFromUrl(pt.generation.url)!,
            typeId: idFromUrl(t.type.url)!,
            slot: t.slot,
          })),
        ),
      );
    }
    if (p.past_abilities) {
      await insertChunked(
        pokemonAbilityHistoryTable,
        p.past_abilities.flatMap((pa) =>
          pa.abilities.map((a) => ({
            pokemonId: p.id,
            generationId: idFromUrl(pa.generation.url)!,
            abilityId: idFromUrl(a.ability?.url),
            isHidden: a.is_hidden,
            slot: a.slot,
          })),
        ),
      );
    }
    if (p.past_stats) {
      await insertChunked(
        pokemonStatHistoryTable,
        p.past_stats.flatMap((ps) =>
          ps.stats.map((s) => ({
            pokemonId: p.id,
            generationId: idFromUrl(ps.generation.url)!,
            statId: idFromUrl(s.stat.url)!,
            baseStat: s.base_stat,
            effort: s.effort,
          })),
        ),
      );
    }
    await insertChunked(pokemonSpritesTable, flattenSprites(p.id, p.sprites));
  }
  logger.info({ count: files.length }, "pokemon seeded");
}

async function seedPokemonSpeciesVarieties() {
  type Species = {
    id: number;
    varieties: { is_default: boolean; pokemon: { url: string } }[];
  };
  const rows = (await readAllFromCache("pokemon-species")) as Species[];
  await insertChunked(
    pokemonSpeciesVarietiesTable,
    rows.flatMap((r) =>
      r.varieties.map((v) => ({
        pokemonSpeciesId: r.id,
        pokemonId: idFromUrl(v.pokemon.url)!,
        isDefault: v.is_default,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokemon-species varieties seeded");
}

async function backfillEvolutionChainIds() {
  type Species = {
    id: number;
    evolution_chain: { url: string } | null;
  };
  const rows = (await readAllFromCache("pokemon-species")) as Species[];
  for (const s of rows) {
    if (!s.evolution_chain) continue;
    const chainId = idFromUrl(s.evolution_chain.url);
    if (chainId === null) continue;
    await db
      .update(pokemonSpeciesTable)
      .set({ evolutionChainId: chainId })
      .where(eq(pokemonSpeciesTable.pokemonSpeciesId, s.id));
  }
  logger.info("pokemon_species.evolutionChainId backfilled");
}

async function backfillEvolvesFromSpeciesIds() {
  type Species = {
    id: number;
    evolves_from_species: { url: string } | null;
  };
  const rows = (await readAllFromCache("pokemon-species")) as Species[];
  for (const s of rows) {
    if (!s.evolves_from_species) continue;
    const parentId = idFromUrl(s.evolves_from_species.url);
    if (parentId === null) continue;
    await db
      .update(pokemonSpeciesTable)
      .set({ evolvesFromSpeciesId: parentId })
      .where(eq(pokemonSpeciesTable.pokemonSpeciesId, s.id));
  }
  logger.info("pokemon_species.evolvesFromSpeciesId backfilled");
}

async function backfillContestTypeBerryFlavors() {
  type CT = { id: number; berry_flavor: { url: string } | null };
  const rows = (await readAllFromCache("contest-type")) as CT[];
  for (const r of rows) {
    if (!r.berry_flavor) continue;
    const berryFlavorId = idFromUrl(r.berry_flavor.url);
    if (berryFlavorId === null) continue;
    await db
      .update(contestTypesTable)
      .set({ berryFlavorId })
      .where(eq(contestTypesTable.contestTypeId, r.id));
  }
  logger.info("contest_types.berryFlavorId backfilled");
}

// ──────────────────────────────────────────────
// Wave 9
// ──────────────────────────────────────────────

async function seedPokemonForms() {
  type Form = {
    id: number;
    name: string;
    form_name: string;
    form_order: number;
    order: number;
    is_default: boolean;
    is_battle_only: boolean;
    is_mega: boolean;
    pokemon: { url: string };
    version_group: { url: string };
    types: { slot: number; type: { url: string } }[];
    names: NR[];
    form_names: NR[];
  };
  const rows = (await readAllFromCache("pokemon-form")) as Form[];
  await insertChunked(
    pokemonFormsTable,
    rows.map((r) => ({
      pokemonFormId: r.id,
      name: r.name,
      formName: r.form_name || null,
      formOrder: r.form_order,
      order: r.order,
      isDefault: r.is_default,
      isBattleOnly: r.is_battle_only,
      isMega: r.is_mega,
      pokemonId: idFromUrl(r.pokemon.url)!,
      versionGroupId: idFromUrl(r.version_group.url)!,
      url: `https://pokeapi.co/api/v2/pokemon-form/${r.id}/`,
    })),
  );
  await insertChunked(
    pokemonFormNamesTable,
    rows.flatMap((r) =>
      r.names.map((n) => ({
        pokemonFormId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    pokemonFormFormNamesTable,
    rows.flatMap((r) =>
      r.form_names.map((n) => ({
        pokemonFormId: r.id,
        localLanguageId: langId(n),
        name: n.name,
      })),
    ),
  );
  await insertChunked(
    pokemonFormTypesTable,
    rows.flatMap((r) =>
      r.types.map((t) => ({
        pokemonFormId: r.id,
        typeId: idFromUrl(t.type.url)!,
        slot: t.slot,
      })),
    ),
  );
  logger.info({ count: rows.length }, "pokemon-forms seeded");
}

// ──────────────────────────────────────────────
// Wave 10 — type sprites + history tables + wild encounters
// ──────────────────────────────────────────────

async function buildGenerationNameMap(): Promise<Map<string, number>> {
  type Gen = { id: number; name: string };
  const rows = (await readAllFromCache("generation")) as Gen[];
  return new Map(rows.map((g) => [g.name, g.id]));
}

async function seedTypeSprites() {
  type SpriteValue = { name_icon: string | null; symbol_icon: string | null };
  type T = {
    id: number;
    sprites: Record<string, Record<string, SpriteValue>>;
  };
  const rows = (await readAllFromCache("type")) as T[];
  const genMap = await buildGenerationNameMap();
  const sprites: {
    typeId: number;
    generationId: number;
    gameName: string;
    variant: string;
    url: string;
  }[] = [];
  for (const r of rows) {
    if (!r.sprites) continue;
    for (const [genName, games] of Object.entries(r.sprites)) {
      const generationId = genMap.get(genName);
      if (generationId === undefined) continue;
      for (const [gameName, sv] of Object.entries(games)) {
        if (typeof sv?.name_icon === "string") {
          sprites.push({
            typeId: r.id,
            generationId,
            gameName,
            variant: "name_icon",
            url: sv.name_icon,
          });
        }
        if (typeof sv?.symbol_icon === "string") {
          sprites.push({
            typeId: r.id,
            generationId,
            gameName,
            variant: "symbol_icon",
            url: sv.symbol_icon,
          });
        }
      }
    }
  }
  await insertChunked(typeSpritesTable, sprites);
  logger.info({ count: sprites.length }, "type-sprites seeded");
}

async function seedTypeEfficacyHistory() {
  type DmgRelations = {
    double_damage_to: { url: string }[];
    half_damage_to: { url: string }[];
    no_damage_to: { url: string }[];
  };
  type T = {
    id: number;
    past_damage_relations: {
      generation: { url: string };
      damage_relations: DmgRelations;
    }[];
  };
  const rows = (await readAllFromCache("type")) as T[];
  const history: {
    generationId: number;
    attackingTypeId: number;
    defendingTypeId: number;
    damageFactor: number;
  }[] = [];
  for (const r of rows) {
    for (const pdr of r.past_damage_relations ?? []) {
      const generationId = idFromUrl(pdr.generation.url)!;
      for (const t of pdr.damage_relations.double_damage_to) {
        history.push({
          generationId,
          attackingTypeId: r.id,
          defendingTypeId: idFromUrl(t.url)!,
          damageFactor: 200,
        });
      }
      for (const t of pdr.damage_relations.half_damage_to) {
        history.push({
          generationId,
          attackingTypeId: r.id,
          defendingTypeId: idFromUrl(t.url)!,
          damageFactor: 50,
        });
      }
      for (const t of pdr.damage_relations.no_damage_to) {
        history.push({
          generationId,
          attackingTypeId: r.id,
          defendingTypeId: idFromUrl(t.url)!,
          damageFactor: 0,
        });
      }
    }
  }
  await insertChunked(typeEfficacyHistoryTable, history);
  logger.info({ count: history.length }, "type-efficacy-history seeded");
}

async function seedAbilityEffectHistory() {
  type Ability = {
    id: number;
    effect_changes: {
      version_group: { url: string };
      effect_entries: {
        effect: string;
        short_effect?: string | null;
        language: { url: string };
      }[];
    }[];
  };
  const rows = (await readAllFromCache("ability")) as Ability[];
  const history: {
    abilityId: number;
    versionGroupId: number;
    localLanguageId: number;
    effect: string;
    shortEffect: string | null;
  }[] = [];
  for (const r of rows) {
    for (const ec of r.effect_changes ?? []) {
      const versionGroupId = idFromUrl(ec.version_group.url)!;
      for (const e of ec.effect_entries) {
        history.push({
          abilityId: r.id,
          versionGroupId,
          localLanguageId: idFromUrl(e.language.url)!,
          effect: e.effect,
          shortEffect: e.short_effect ?? null,
        });
      }
    }
  }
  await insertChunked(abilityEffectHistoryTable, history);
  logger.info({ count: history.length }, "ability-effect-history seeded");
}

async function seedMoveValueHistory() {
  type Move = {
    id: number;
    past_values: {
      accuracy: number | null;
      effect_chance: number | null;
      power: number | null;
      pp: number | null;
      type: { url: string } | null;
      version_group: { url: string };
      effect_entries: {
        effect: string;
        short_effect?: string | null;
        language: { url: string };
      }[];
    }[];
  };
  const rows = (await readAllFromCache("move")) as Move[];
  // Two-pass insert: parent row first, then look up its surrogate id to insert children.
  for (const r of rows) {
    for (const pv of r.past_values ?? []) {
      const versionGroupId = idFromUrl(pv.version_group.url)!;
      const inserted = await db
        .insert(moveValueHistoryTable)
        .values({
          moveId: r.id,
          versionGroupId,
          accuracy: pv.accuracy,
          effectChance: pv.effect_chance,
          power: pv.power,
          pp: pv.pp,
          typeId: idFromUrl(pv.type?.url),
        })
        .onConflictDoNothing()
        .returning({ id: moveValueHistoryTable.moveValueHistoryId });
      const parentId = inserted[0]?.id;
      if (parentId === undefined) continue;
      if (pv.effect_entries.length > 0) {
        await insertChunked(
          moveValueHistoryEffectEntriesTable,
          pv.effect_entries.map((e) => ({
            moveValueHistoryId: parentId,
            localLanguageId: idFromUrl(e.language.url)!,
            effect: e.effect,
            shortEffect: e.short_effect ?? null,
          })),
        );
      }
    }
  }
  logger.info("move-value-history seeded");
}

async function seedMoveEffectHistory() {
  type Move = {
    id: number;
    effect_changes: {
      version_group: { url: string };
      effect_entries: { effect: string; language: { url: string } }[];
    }[];
  };
  const rows = (await readAllFromCache("move")) as Move[];
  const history: {
    moveId: number;
    versionGroupId: number;
    localLanguageId: number;
    effect: string;
  }[] = [];
  for (const r of rows) {
    for (const ec of r.effect_changes ?? []) {
      const versionGroupId = idFromUrl(ec.version_group.url)!;
      for (const e of ec.effect_entries) {
        history.push({
          moveId: r.id,
          versionGroupId,
          localLanguageId: idFromUrl(e.language.url)!,
          effect: e.effect,
        });
      }
    }
  }
  await insertChunked(moveEffectHistoryTable, history);
  logger.info({ count: history.length }, "move-effect-history seeded");
}

async function seedRegionMetadata() {
  // Backfill regions.mainGenerationId (regions seed runs BEFORE generations,
  // so we couldn't set it at insert time) AND insert the region <-> version_group M2M.
  type Reg = {
    id: number;
    main_generation: { url: string } | null;
    version_groups: { url: string }[];
  };
  const rows = (await readAllFromCache("region")) as Reg[];
  for (const r of rows) {
    if (r.main_generation) {
      const generationId = idFromUrl(r.main_generation.url);
      if (generationId !== null) {
        await db
          .update(regionsTable)
          .set({ mainGenerationId: generationId })
          .where(eq(regionsTable.regionId, r.id));
      }
    }
  }
  await insertChunked(
    regionVersionGroupsTable,
    rows.flatMap((r) =>
      r.version_groups.map((vg) => ({
        regionId: r.id,
        versionGroupId: idFromUrl(vg.url)!,
      })),
    ),
  );
  logger.info("region metadata seeded");
}

async function seedMoveContestCombos() {
  type ComboList = { url: string }[] | null;
  type Move = {
    id: number;
    contest_combos: {
      normal: { use_before: ComboList; use_after: ComboList };
      super: { use_before: ComboList; use_after: ComboList };
    } | null;
  };
  const rows = (await readAllFromCache("move")) as Move[];
  const combos: {
    moveId: number;
    pairedMoveId: number;
    kind: string;
    position: string;
  }[] = [];
  for (const r of rows) {
    if (!r.contest_combos) continue;
    for (const kind of ["normal", "super"] as const) {
      const bucket = r.contest_combos[kind];
      if (!bucket) continue;
      for (const position of ["before", "after"] as const) {
        const list =
          position === "before" ? bucket.use_before : bucket.use_after;
        if (!list) continue;
        for (const m of list) {
          combos.push({
            moveId: r.id,
            pairedMoveId: idFromUrl(m.url)!,
            kind,
            position,
          });
        }
      }
    }
  }
  await insertChunked(moveContestCombosTable, combos);
  logger.info({ count: combos.length }, "move-contest-combos seeded");
}

async function seedWildEncounters() {
  // Source: pokemon-location-area/<pokemonId>.json — much cleaner per-pokemon
  // shape than the equivalent in location-area/*.json.
  type EncounterDetail = {
    chance: number;
    min_level: number;
    max_level: number;
    method: { url: string };
    condition_values: { url: string }[];
  };
  type VersionDetails = {
    version: { url: string };
    encounter_details: EncounterDetail[];
  };
  type Entry = {
    location_area: { url: string };
    version_details: VersionDetails[];
  };

  const dir = path.join(cacheBase, "pokemon-location-area");
  let entries: string[];
  try {
    entries = await fsPromises.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      logger.warn("pokemon-location-area cache missing — skipping");
      return;
    }
    throw err;
  }
  let total = 0;
  for (const file of entries.filter(
    (f) => f.endsWith(".json") && !f.startsWith("__"),
  )) {
    const pokemonId = parseInt(file.replace(/\.json$/, ""));
    if (isNaN(pokemonId)) continue;
    const raw = await fsPromises.readFile(path.join(dir, file), "utf8");
    const arr = JSON.parse(raw) as Entry[];
    if (arr.length === 0) continue;
    for (const e of arr) {
      const locationAreaId = idFromUrl(e.location_area.url)!;
      for (const vd of e.version_details) {
        const versionId = idFromUrl(vd.version.url)!;
        for (const ed of vd.encounter_details) {
          const inserted = await db
            .insert(wildEncountersTable)
            .values({
              pokemonId,
              locationAreaId,
              versionId,
              encounterMethodId: idFromUrl(ed.method.url)!,
              minLevel: ed.min_level,
              maxLevel: ed.max_level,
              chance: ed.chance,
            })
            .returning({ id: wildEncountersTable.wildEncounterId });
          const wildEncounterId = inserted[0]?.id;
          if (wildEncounterId === undefined) continue;
          total++;
          if (ed.condition_values.length > 0) {
            await insertChunked(
              wildEncounterConditionValuesTable,
              ed.condition_values.map((cv) => ({
                wildEncounterId,
                encounterConditionValueId: idFromUrl(cv.url)!,
              })),
            );
          }
        }
      }
    }
  }
  logger.info({ count: total }, "wild-encounters seeded");
}

// ──────────────────────────────────────────────
// Seed-run metadata (meta.pokeapi_seed_runs)
// ──────────────────────────────────────────────

async function startSeedRun(): Promise<number> {
  let sourceCommit: string | null = null;
  try {
    sourceCommit = execSync("git rev-parse HEAD", { cwd: process.cwd() })
      .toString()
      .trim();
  } catch {
    /* ignore — not a git repo or git unavailable */
  }
  let pokeapiSnapshotDate: Date | null = null;
  try {
    const stat = await fsPromises.stat(cacheBase);
    pokeapiSnapshotDate = stat.mtime;
  } catch {
    /* ignore */
  }
  const inserted = await db
    .insert(pokeapiSeedRunsTable)
    .values({
      status: "running",
      sourceCommit,
      pokeapiSnapshotDate,
    })
    .returning({ id: pokeapiSeedRunsTable.pokeapiSeedRunId });
  return inserted[0]!.id;
}

async function collectRowCounts(): Promise<Record<string, number>> {
  const rows = await db.execute<{ table_name: string; count: string }>(sql`
    SELECT
      'pokeapi.' || c.table_name AS table_name,
      (xpath('/row/c/text()', xml_count))[1]::text AS count
    FROM (
      SELECT table_name,
        query_to_xml(format('select count(*) AS c from %I.%I', table_schema, table_name), false, true, '') AS xml_count
      FROM information_schema.tables
      WHERE table_schema = 'pokeapi' AND table_type = 'BASE TABLE'
    ) c
  `);
  const result: Record<string, number> = {};
  for (const r of rows.rows) result[r.table_name] = parseInt(r.count);
  return result;
}

async function finishSeedRun(
  runId: number,
  status: "success" | "failed",
): Promise<void> {
  let rowCounts: string | null = null;
  if (status === "success") {
    try {
      rowCounts = JSON.stringify(await collectRowCounts());
    } catch (err) {
      logger.warn({ err }, "Failed to collect row counts");
    }
  }
  await db
    .update(pokeapiSeedRunsTable)
    .set({
      status,
      completedAt: new Date(),
      tableRowCounts: rowCounts,
    })
    .where(eq(pokeapiSeedRunsTable.pokeapiSeedRunId, runId));
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

export async function seed(): Promise<void> {
  logger.info("Starting PokeAPI seed");
  const runId = await startSeedRun();
  try {
    await runSeed();
    await finishSeedRun(runId, "success");
    logger.info("PokeAPI seed complete");
  } catch (err) {
    await finishSeedRun(runId, "failed");
    throw err;
  }
}

async function runSeed(): Promise<void> {
  await clearPokeApi();

  // Wave 0
  await seedLanguages();
  await seedMoveAilments();
  await seedMoveBattleStyles();
  await seedMoveCategories();

  // Wave 1
  await seedMoveDamageClasses();
  await seedStats();
  await seedBerryFirmnesses();
  await seedPokeathlonStats();
  await seedPokemonColors();
  await seedPokemonHabitats();
  await seedPokemonShapes();
  await seedEncounterMethods();
  await seedEvolutionTriggers();
  await seedItemFlingEffects();
  await seedItemPockets();
  await seedItemAttributes();
  await seedEggGroups();
  await seedGenders();
  await seedMoveLearnMethods();
  await seedMoveTargets();
  await seedSuperContestEffects();
  await seedContestEffects();

  // Wave 2
  await seedContestTypes();
  await seedBerryFlavors();
  await seedRegions();
  await seedPalParkAreas();
  await seedGrowthRates();

  // Wave 3
  await seedGenerations();
  await seedEncounterConditions();

  // Wave 4
  await seedVersionGroups();
  await seedVersions();
  await seedEncounterConditionValues();
  await seedCharacteristics();
  await seedTypes();
  await seedNatures();

  // Wave 5
  await seedItemCategories();
  await seedLocations();
  await seedAbilities();
  await seedMoves();

  // Wave 6
  await seedItems();
  await seedBerries();
  await seedLocationAreas();

  // Wave 7
  await seedMachines();
  await seedPokemonSpecies();
  await seedEvolutionChains();

  // Wave 8
  await seedPokedexes();
  await seedPokemon();
  await seedPokemonSpeciesVarieties();
  await backfillEvolutionChainIds();
  await backfillEvolvesFromSpeciesIds();
  await backfillContestTypeBerryFlavors();

  // Wave 9
  await seedPokemonForms();

  // Wave 10 — history tables + new JSON-data tables
  await seedTypeSprites();
  await seedTypeEfficacyHistory();
  await seedAbilityEffectHistory();
  await seedMoveValueHistory();
  await seedMoveEffectHistory();
  await seedRegionMetadata();
  await seedMoveContestCombos();
  await seedWildEncounters();
}

if (process.argv[1]?.endsWith("seed.ts")) {
  try {
    await seed();
  } catch (err) {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  } finally {
    await db.$client.end();
  }
}
