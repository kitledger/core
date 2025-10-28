import { serverConfig } from "../../../../config.js";
import { auth } from "../../../../services/http/middleware/auth_middleware.js";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { createUnitModel } from "../../../../domain/actions/unit_model_actions.js";
import { UnitModelCreateData } from "../../../../domain/types/unit_model_types.js";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { isValidationFailure } from "../../../../domain/utils/validation.js";
import { createLedger } from "../../../../domain/actions/ledger_actions.js";
import { Ledger, LedgerCreateData } from "../../../../domain/types/ledger_types.js";
import { Account, AccountCreateData } from "../../../../domain/types/account_types.js";
import { filterAccounts } from "../../../../domain/repositories/account_repository.js";
import { createAccount } from "../../../../domain/actions/account_actions.js";
import { filterLedgers } from "../../../../domain/repositories/ledger_repository.js";
import { filterEntityModels } from "../../../../domain/repositories/entity_model_repository.js";
import { filterTransactionModels } from "../../../../domain/repositories/transaction_model_repository.js";
import { filterUnitModels } from "../../../../domain/repositories/unit_model_repository.js";
import { createEntityModel } from "../../../../domain/actions/entity_model_actions.js";
import { EntityModel, EntityModelCreateData } from "../../../../domain/types/entity_model_types.js";
import { createTransactionModel } from "../../../../domain/actions/transaction_model_actions.js";
import { TransactionModel, TransactionModelCreateData } from "../../../../domain/types/transaction_model_types.js";
import { GetOperationResult, GetOperationType } from "../../../database/helpers.js";
import { UnitModel } from "../../../../domain/types/unit_model_types.js";
import { getAuthUser } from "../../../../domain/repositories/user_repository.js";

type Variables = {
  user?: string
}
const router = new Hono<{Variables: Variables}>();

router.use(cors(serverConfig.cors));
router.use(auth);
router.get("/", (c) => {
	return c.json({ message: "Welcome to the Kitledger API!" });
});

router.get("/accounts", async (c) => {
	try {
		const search_params = c.req.query();

		const structured_query = search_params.query ? search_params.query : undefined;
		const search = search_params.search ? search_params.search : undefined;
		let getOperationType: GetOperationType = GetOperationType.FILTER;

		if (structured_query) {
			getOperationType = GetOperationType.QUERY;
		}
		else if (search) {
			getOperationType = GetOperationType.SEARCH;
		}

		let results: GetOperationResult<Account>;

		switch (getOperationType) {
			case GetOperationType.FILTER:
				results = await filterAccounts(search_params);
				break;
			case GetOperationType.SEARCH:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			case GetOperationType.QUERY:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			default:
				results = { data: [], limit: 0, offset: 0, count: 0 };
		}

		return c.json(results);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.post("/accounts", async (c) => {
	try {
		const data = await c.req.json() as AccountCreateData;
		const account = await createAccount(data);

		if (isValidationFailure(account)) {
			const status: ContentfulStatusCode = account.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(account, status);
		}

		return c.json({ data: { account: account.data } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("/entity-models", async (c) => {
	try {
		const search_params = c.req.query();

		const structured_query = search_params.query ? search_params.query : undefined;
		const search = search_params.search ? search_params.search : undefined;
		let getOperationType: GetOperationType = GetOperationType.FILTER;

		if (structured_query) {
			getOperationType = GetOperationType.QUERY;
		}
		else if (search) {
			getOperationType = GetOperationType.SEARCH;
		}

		let results: GetOperationResult<EntityModel>;

		switch (getOperationType) {
			case GetOperationType.FILTER:
				results = await filterEntityModels(search_params);
				break;
			case GetOperationType.SEARCH:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			case GetOperationType.QUERY:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			default:
				results = { data: [], limit: 0, offset: 0, count: 0 };
		}

		return c.json(results);
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

		if (isValidationFailure(entityModel)) {
			const status: ContentfulStatusCode = entityModel.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(entityModel, status);
		}

		return c.json({ data: { entity_model: entityModel.data } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("ledgers", async (c) => {
	try {
		const search_params = c.req.query();

		const structured_query = search_params.query ? search_params.query : undefined;
		const search = search_params.search ? search_params.search : undefined;
		let getOperationType: GetOperationType = GetOperationType.FILTER;

		if (structured_query) {
			getOperationType = GetOperationType.QUERY;
		}
		else if (search) {
			getOperationType = GetOperationType.SEARCH;
		}

		let results: GetOperationResult<Ledger>;

		switch (getOperationType) {
			case GetOperationType.FILTER:
				results = await filterLedgers(search_params);
				break;
			case GetOperationType.SEARCH:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			case GetOperationType.QUERY:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			default:
				results = { data: [], limit: 0, offset: 0, count: 0 };
		}

		return c.json(results);
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

		if (isValidationFailure(ledger)) {
			const status: ContentfulStatusCode = ledger.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(ledger, status);
		}

		return c.json({ data: { ledger: ledger.data } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("/transaction-models", async (c) => {
	try {
		const search_params = c.req.query();

		const structured_query = search_params.query ? search_params.query : undefined;
		const search = search_params.search ? search_params.search : undefined;
		let getOperationType: GetOperationType = GetOperationType.FILTER;

		if (structured_query) {
			getOperationType = GetOperationType.QUERY;
		}
		else if (search) {
			getOperationType = GetOperationType.SEARCH;
		}

		let results: GetOperationResult<TransactionModel>;

		switch (getOperationType) {
			case GetOperationType.FILTER:
				results = await filterTransactionModels(search_params);
				break;
			case GetOperationType.SEARCH:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			case GetOperationType.QUERY:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			default:
				results = { data: [], limit: 0, offset: 0, count: 0 };
		}

		return c.json(results);
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

		if (isValidationFailure(transactionModel)) {
			const status: ContentfulStatusCode = transactionModel.errors?.some((e) => e.type === "structure")
				? 422
				: 400;
			return c.json(transactionModel, status);
		}

		return c.json({ data: { transaction_model: transactionModel.data } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("/unit-models", async (c) => {
	try {
		const search_params = c.req.query();

		const structured_query = search_params.query ? search_params.query : undefined;
		const search = search_params.search ? search_params.search : undefined;
		let getOperationType: GetOperationType = GetOperationType.FILTER;

		if (structured_query) {
			getOperationType = GetOperationType.QUERY;
		}
		else if (search) {
			getOperationType = GetOperationType.SEARCH;
		}

		let results: GetOperationResult<UnitModel>;

		switch (getOperationType) {
			case GetOperationType.FILTER:
				results = await filterUnitModels(search_params);
				break;
			case GetOperationType.SEARCH:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			case GetOperationType.QUERY:
				results = { data: [], limit: 0, offset: 0, count: 0 };
				break;
			default:
				results = { data: [], limit: 0, offset: 0, count: 0 };
		}

		return c.json(results);
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

		if (isValidationFailure(unitModel)) {
			const status: ContentfulStatusCode = unitModel.errors?.some((e) => e.type === "structure") ? 422 : 400;
			return c.json(unitModel, status);
		}

		return c.json({ data: { unit_model: unitModel.data } }, 201);
	}
	catch (error) {
		console.error(error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("/user", async (c) => {
	const userId = c.get("user");
	
	if (!userId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const appUser = await getAuthUser(userId);

	if (!appUser) {
		return c.json({ error: "User not found" }, 404);
	}

	return c.json({ data: appUser });
});

export const apiV1Router = router;
export const apiV1Prefix = "/api/v1";
