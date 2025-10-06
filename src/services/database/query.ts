import {
    AggregateColumn,
    Column,
    Filter,
    FilterGroup,
    QueryOptions,
    SimpleColumn,
} from "@kitledger/query/common";
import { PgTable, PgColumn } from "drizzle-orm/pg-core";
import { db } from "./db.ts"; // Assuming this is your Drizzle instance
import { GetOperationResult } from "./helpers.ts";
import * as v from "@valibot/valibot";

export type QueryResult = Record<string, string | number | null>;

function validateQueryParams(params: QueryOptions) {

}

export async function executeQuery<T>(params: QueryOptions): Promise<GetOperationResult<T>> {


	return {
		data: [],
		count: 0,
		offset: 0,
		limit: 0
	}
}

