import { ConditionGroup, Query, QuerySchema } from "@kitledger/query";
import { PgTable } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";
import { parseValibotIssues, ValidationResult } from "../../domain/base/validation.ts";
import { db } from "./db.ts";
import {
	defaultLimit,
	defaultOffset,
	GetOperationResult,
	maxLimit,
	QueryResultRow,
	QueryResultSchema,
} from "./helpers.ts";
import * as v from "@valibot/valibot";
import knex, { Knex } from "knex";

function validateQueryParams(params: Query): ValidationResult<Query> {
	const result = v.safeParse(QuerySchema, params);

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
export async function executeQuery(table: PgTable, params: Query): Promise<GetOperationResult<QueryResultRow>> {
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

		const { sql, bindings } = buildQuery(knexBuilder, getTableName(table), params, limit, offset)
			.toSQL()
			.toNative();

		console.log("Executing query:", sql, bindings);

		const queryResult = await db.$client.unsafe(sql, bindings as string[]);

		console.log("Query result:", queryResult);

		const parsedQueryResult = v.safeParse(QueryResultSchema, queryResult);

		if (!parsedQueryResult.success) {
			console.error("Failed to parse query result", parsedQueryResult.issues);
			throw new Error("Failed to parse query result");
		}

		return {
			data: parsedQueryResult.output,
			count: parsedQueryResult.output.length ?? 0,
			offset: offset,
			limit: limit,
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

// Recursive helper to process filter groups
function applyFilters(queryBuilder: Knex.QueryBuilder, filterGroup: ConditionGroup) {
	// Use a nested 'where' to group conditions with parentheses, e.g., WHERE ( ... )
	queryBuilder.where(function () {
		for (const filter of filterGroup.conditions) {
			// Determine the chaining method (.where or .orWhere)
			const connector = filterGroup.connector;
			const method = filterGroup.connector === "or" ? "orWhere" : "where";

			// If the filter is another group, recurse
			if ("connector" in filter) {
				this[method](function () {
					applyFilters(this, { connector: "and", conditions: [filter] });
				});
				continue;
			}

			// Apply the specific filter condition
			const { column, operator, value } = filter;
			switch (operator) {
				case "in": {
					const caseMethod = connector === "or" ? "orWhereIn" : "whereIn";
					this[caseMethod](column, value);
					break;
				}

				case "not_in": {
					const caseMethod = connector === "or" ? "orWhereNotIn" : "whereNotIn";
					this[caseMethod](column, value);
					break;
				}

				case "empty": {
					const caseMethod = connector === "or" ? "orWhereNull" : "whereNull";
					this[caseMethod](column);
					break;
				}

				case "not_empty": {
					const caseMethod = connector === "or" ? "orWhereNotNull" : "whereNotNull";
					this[caseMethod](column);
					break;
				}
				// Handles =, !=, >, <, etc.
				default: {
					this[method](column, operator, value);
					break;
				}
			}
		}
	});
}

/**
 * Builds a Knex query object from a QueryOptions configuration.
 * @param kx - The Knex instance.
 * @param tableName - The name of the table to query.
 * @param options - The QueryOptions object.
 * @returns A Knex QueryBuilder instance.
 */
export function buildQuery(
	kx: Knex,
	tableName: string,
	options: Query,
	limit: number,
	offset: number,
): Knex.QueryBuilder {
	const query = kx(tableName);

	// 1. Process Columns (SELECT)
	const selections = options.select.map((col) => {
		if (typeof col === "string") {
			return col;
		}
		if ("func" in col) {
			// Use knex.raw for aggregate functions to prevent SQL injection
			return kx.raw(`${col.func.toUpperCase()}(??) as ??`, [col.column, col.as]);
		}
		// Handle aliasing
		return col.as ? `${col.column} as ${col.as}` : col.column;
	});
	query.select(selections);

	// 2. Process Filters (WHERE)
	options.where.forEach((group) => applyFilters(query, group));

	// 3. Process Group By
	if (options.groupBy?.length) {
		query.groupBy(options.groupBy);
	}

	// 4. Process Sorts (ORDER BY)
	if (options.orderBy?.length) {
		// Knex's orderBy can take an array of objects directly
		query.orderBy(options.orderBy.map((s) => ({ column: s.column, order: s.direction })));
	}

	// 5. Process Limit
	query.limit(limit);

	// 6. Process Offset
	query.offset(offset);

	return query;
}
