import assert from "node:assert";
import { after, describe, test } from "node:test";
import { db } from "../../src/server/services/database/db.js";
import { createTransactionModel } from "../../src/server/domain/actions/transaction_model_actions.js";
import { TransactionModelFactory } from "../../src/server/domain/factories/transaction_factories.js";

describe("Transaction Domain Tests", () => {
	after(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	test("Can create a valid transaction model", async () => {
		const transactionModelFactory = new TransactionModelFactory();
		const transactionModelData = transactionModelFactory.make(1)[0];
		transactionModelData.active = true;
		const transactionModelResult = await createTransactionModel(transactionModelData);

		if (transactionModelResult.success === false) {
			throw new Error("Failed to create Transaction Model");
		}

		assert(transactionModelResult.success === true);
	});

	test("Applies transaction model validation correctly", async () => {
		const transactionModelFactory = new TransactionModelFactory();
		const transactionModelData = transactionModelFactory.make(1)[0];
		const transactionModelResult = await createTransactionModel(transactionModelData);

		if (transactionModelResult.success === false) {
			throw new Error("Failed to create Transaction Model");
		}

		const missingNameTransactionModel = transactionModelFactory.make(1)[0];
		missingNameTransactionModel.name = "";
		const missingNameTransactionModelResult = await createTransactionModel(missingNameTransactionModel);

		assert(missingNameTransactionModelResult.success === false);

		const duplicateIdsTransactionModel = transactionModelFactory.make(1)[0];
		duplicateIdsTransactionModel.id = transactionModelResult.data.id;
		duplicateIdsTransactionModel.ref_id = transactionModelResult.data.ref_id;
		duplicateIdsTransactionModel.alt_id = transactionModelResult.data.alt_id;
		const duplicateIdsTransactionModelResult = await createTransactionModel(duplicateIdsTransactionModel);

		assert(duplicateIdsTransactionModelResult.success === false);
	});
});
