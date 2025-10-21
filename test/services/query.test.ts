import { executeQuery } from "../../src/services/database/query.ts";
import { Query } from "@kitledger/query";
import { LedgerFactory, AccountFactory } from "../../src/domain/ledger/factories.ts";
import { createLedger } from "../../src/domain/ledger/ledger_actions.ts";
import { createAccount } from "../../src/domain/ledger/account_actions.ts";
import { createUnitModel } from "../../src/domain/unit/unit_model_actions.ts";
import { accounts } from "../../src/services/database/schema.ts";
import { UnitModelFactory } from "../../src/domain/unit/factories.ts";
import { assert } from "@std/assert";
import { describe, beforeAll, afterAll, test } from "@std/testing/bdd";
import { db } from "../../src/services/database/db.ts";

describe("Database Query Service Tests", () => {
	beforeAll(async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		unitModelData.active = true;
		const unitModelResult = await createUnitModel(unitModelData);

		if(unitModelResult.success === false || !unitModelResult.data || !Object.keys(unitModelResult.data).includes('id')) {
			throw new Error("Failed to create Unit Model");
		}

		const ledgerFactory = new LedgerFactory();
		const ledgerData = ledgerFactory.make(1)[0];
		ledgerData.unit_model_id = unitModelResult.data.id;
		const ledgerResult = await createLedger(ledgerData);

		if(ledgerResult.success === false) {
			throw new Error("Failed to create Ledger");
		}

		const accountFactory = new AccountFactory();
		const accountData = accountFactory.make(1)[0];
		accountData.ledger_id = ledgerResult.data.id;
		accountData.parent_id = null;
		const accountResult = await createAccount(accountData);

		if(accountResult.success === false) {
			throw new Error("Failed to create Account");
		}

		const childAccountData = accountFactory.make(1)[0];
		childAccountData.ledger_id = ledgerResult.data.id;
		childAccountData.parent_id = accountResult.data.id;
		childAccountData.balance_type = accountData.balance_type;
		const childAccountResult = await createAccount(childAccountData);

		if(childAccountResult.success === false) {
			throw new Error("Failed to create Child Account");
		}
	});

	afterAll(async () => {
		await db.$client.end();
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