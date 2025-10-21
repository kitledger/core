import { executeQuery } from "../../../src/services/database/query.ts";
import { Query } from "@kitledger/query";
import { LedgerFactory, AccountFactory } from "../../../src/domain/ledger/factories.ts";
import { accounts } from "../../../src/services/database/schema.ts";
import { assert } from "@std/assert";
import { describe, beforeAll, afterAll, test } from "@std/testing/bdd";

describe("Database Query Service Tests", () => {
	beforeAll(async () => {
		// Use factories as needed to populate test data.
	});

	afterAll(async () => {
		// Clean up test data if necessary.
	});

	test("Execute Ledger Query with Simple Conditions", async () => {
		const queryParams: Query = {
			select: [
				{ column: "accounts.id", as: "account_id" },
				{ column: "parent.name", as: "parent_name" },
			],
			joins: [
				{
					type: "left",
					table: "accounts",
					as: "parent",
					onLeft: "accounts.parent_id",
					onRight: "parent.id",
				}
			],
			where: [
				{
					connector: "and",
					conditions: [
						// This condition correctly finds all accounts that have a parent
						{ column: "accounts.parent_id", operator: "not_empty", value: true },
					],
				}
			],
			orderBy: [
				{ column: "accounts.created_at", direction: "desc" },
			],
			limit: 50,
			offset: 0,
		};

		const results = await executeQuery(accounts, queryParams);

		assert(Array.isArray(results.data), "Expected results to be an array");
		assert(results.data.length > 0, "Expected at least one result");
		assert(results.errors?.length === 0 || !results.errors, "Expected no errors in the query results");
	});
});