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
import { createEntityModel } from "../../../../domain/entity/entity_model_actions.ts";
import { createTransactionModel } from "../../../../domain/transaction/transaction_model_actions.ts";

const router = new Hono();

router.use(cors(serverConfig.cors));
router.use(auth);
router.get("/", (c) => {
	return c.json({ message: "Welcome to the Kitledger API!" });
});

router.post("/unit-models", async (c) => {
	try {
		const data = await c.req.json() as UnitModelCreateData; // Better typing via json()
		const unitModel = await createUnitModel(data);

		if (isValidationResult(unitModel)) {
			const status: ContentfulStatusCode = unitModel.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(unitModel, status);
		}

		return c.json({ data: {unit_model: unitModel} }, 201);
	} catch (error) {
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
	} catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export const apiV1Router = router;
export const apiV1Prefix = "/api/v1";
