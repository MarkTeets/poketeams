import { and, desc, eq, lte, SQL } from "drizzle-orm";
import { type PgColumn, type PgTable } from "drizzle-orm/pg-core";

import { db } from "../../database/db";

/**
 * Resolve a field value at a given trainer-selected generation.
 *
 * History tables hold per-generation (or per-version-group resolved to a
 * generation) overrides. The newest override whose discriminator is <= the
 * requested generation wins; if none exists, fall back to the base table's
 * current value.
 *
 * Ad-hoc model queries can replicate this inline — the helper just spares
 * the boilerplate for simple single-value lookups.
 *
 * @param baseTable     table holding the "latest" value
 * @param baseField     column on baseTable to read when no override applies
 * @param baseEntityField column on baseTable for the entity FK predicate
 * @param historyTable  parallel history table holding overrides
 * @param historyField  column on historyTable that mirrors baseField
 * @param historyEntityField column on historyTable for the same entity FK
 * @param discriminatorField column on historyTable holding generationId
 *                           (or a column that resolves to one)
 * @param entityId      the entity's primary key value
 * @param trainerGenerationId the trainer's selected generation
 */
export async function valueAtGeneration<T>(args: {
  baseTable: PgTable;
  baseField: PgColumn;
  baseEntityField: PgColumn;
  historyTable: PgTable;
  historyField: PgColumn;
  historyEntityField: PgColumn;
  discriminatorField: PgColumn;
  entityId: number;
  trainerGenerationId: number;
}): Promise<T | null> {
  const {
    baseTable,
    baseField,
    baseEntityField,
    historyTable,
    historyField,
    historyEntityField,
    discriminatorField,
    entityId,
    trainerGenerationId,
  } = args;

  const historyRows = await db
    .select({ value: historyField })
    .from(historyTable)
    .where(
      and(
        eq(historyEntityField, entityId),
        lte(discriminatorField, trainerGenerationId),
      ) as SQL,
    )
    .orderBy(desc(discriminatorField))
    .limit(1);

  if (historyRows.length > 0) {
    return (historyRows[0]!.value as T) ?? null;
  }

  const baseRows = await db
    .select({ value: baseField })
    .from(baseTable)
    .where(eq(baseEntityField, entityId))
    .limit(1);

  return (baseRows[0]?.value as T | undefined) ?? null;
}
