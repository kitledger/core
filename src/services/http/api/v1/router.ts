import { serverConfig } from "../../../../config.ts";
import { auth } from "../../middleware/auth_middleware.ts";
import { cors } from "@hono/hono/cors";
import { Hono } from "@hono/hono";
import { createUnitModel } from "../../../../domain/unit/unit_model_actions.ts";
import { UnitModelCreateData } from "../../../../domain/unit/types.ts";
import { ContentfulStatusCode } from "@hono/hono/utils/http-status";
import { isValidationResult } from "../../../../domain/base/validation.ts";
import { createLedger } from "../../../../domain/ledger/ledger_actions.ts";
import { LedgerCreateData } from "../../../../domain/ledger/types.ts";
import { createAccount } from "../../../../domain/ledger/account_actions.ts";
import { AccountCreateData } from "../../../../domain/ledger/types.ts";
import { createEntityModel } from "../../../../domain/entity/entity_model_actions.ts";
import { EntityModelCreateData } from "../../../../domain/entity/types.ts";
import { createTransactionModel } from "../../../../domain/transaction/transaction_model_actions.ts";
import { TransactionModelCreateData } from "../../../../domain/transaction/types.ts";

const router = new Hono();

router.use(cors(serverConfig.cors));
router.use(auth);
router.get("/", (c) => {
	return c.json({ message: "Welcome to the Kitledger API!" });
});

router.post("/accounts", async (c) => {
	try {
		const data = await c.req.json() as AccountCreateData;
		const account = await createAccount(data);

		if (isValidationResult(account)) {
			const status: ContentfulStatusCode = account.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(account, status);
		}

		return c.json({ data: { account: account } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.post("/entity-models", async (c) => {
	try {
		const data = await c.req.json() as EntityModelCreateData;
		const entityModel = await createEntityModel(data);

		if (isValidationResult(entityModel)) {
			const status: ContentfulStatusCode = entityModel.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(entityModel, status);
		}

		return c.json({ data: { entity_model: entityModel } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.post("/ledgers", async (c) => {
	try {
		const data = await c.req.json() as LedgerCreateData;
		const ledger = await createLedger(data);

		if (isValidationResult(ledger)) {
			const status: ContentfulStatusCode = ledger.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(ledger, status);
		}

		return c.json({ data: { ledger: ledger } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.post("/transaction-models", async (c) => {
	try {
		const data = await c.req.json() as TransactionModelCreateData;
		const transactionModel = await createTransactionModel(data);

		if (isValidationResult(transactionModel)) {
			const status: ContentfulStatusCode = transactionModel.errors?.some((e) => e.type === "structure")
				? 422
				: 400;
			return c.json(transactionModel, status);
		}

		return c.json({ data: { transaction_model: transactionModel } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.post("/unit-models", async (c) => {
	try {
		const data = await c.req.json() as UnitModelCreateData;
		const unitModel = await createUnitModel(data);

		if (isValidationResult(unitModel)) {
			const status: ContentfulStatusCode = unitModel.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(unitModel, status);
		}

		return c.json({ data: { unit_model: unitModel } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export const apiV1Router = router;
export const apiV1Prefix = "/api/v1";
