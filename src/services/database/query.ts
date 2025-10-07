import { QueryOptions, QueryOptionsSchema } from "@kitledger/query";
import { PgTable } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";
import { parseValibotIssues, ValidationResult } from "../../domain/base/validation.ts";
import { db } from "./db.ts";
import { GetOperationResult, QueryResultSchema, QueryResultRow, defaultLimit, defaultOffset, maxLimit } from "./helpers.ts";
import * as v from "@valibot/valibot";
import knex from "knex";

function validateQueryParams(params: QueryOptions): ValidationResult<QueryOptions> {
	const result = v.safeParse(QueryOptionsSchema, params);

	if (!result.success) {
		return { success: false, errors: parseValibotIssues(result.issues) };
	}

	return { success: true, data: result.output };
}

/**
 * @param table
 * @param params
 * @returns
 */
export async function executeQuery(table: PgTable, params: QueryOptions): Promise<GetOperationResult<QueryResultRow>> {
	const validationResult = validateQueryParams(params);
	const parsedParams = validationResult.success ? validationResult.data : null;

	if (!validationResult.success || !parsedParams) {
		console.error("Validation errors", validationResult.errors);
		return {
			data: [],
			count: 0,
			offset: 0,
			limit: 0,
			errors: validationResult.errors?.map((e) => ({ field: e.path || undefined, message: e.message })),
		};
	}

	try {
		const knexBuilder = knex({ client: "pg" });

		const limit = Math.min(parsedParams.limit ?? defaultLimit, maxLimit);
		const offset = parsedParams.offset ?? defaultOffset;

		const { sql, bindings } = knexBuilder(getTableName(table))
			.select("id", "name")
			.whereILike('name', '%money%')
			.limit(limit)
			.offset(offset)
			.toSQL()
			.toNative();

		const queryResult = await db.$client.unsafe(sql, bindings as string[]);

		const parsedQueryResult = v.safeParse(QueryResultSchema, queryResult);

		if (!parsedQueryResult.success) {
			throw new Error("Failed to parse query result");
		}

		return {
			data: parsedQueryResult.output,
			count: parsedQueryResult.output.length ?? 0,
			offset: offset,
			limit: limit
		};
	}
	catch (error) {
		return {
			data: [],
			count: 0,
			offset: 0,
			limit: 0,
			errors: [{ message: error instanceof Error ? error.message : "Query execution error" }],
		};
	}
}
