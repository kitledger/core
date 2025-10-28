import assert from "node:assert";
import { after, describe, test } from "node:test";
import { db } from "../../src/server/services/database/db.js";
import { createEntityModel } from "../../src/server/domain/actions/entity_model_actions.js";
import { EntityModelFactory } from "../../src/server/domain/factories/entity_factories.js";

describe("Entity Domain Tests", () => {
	after(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	test("Can create a valid entity model", async () => {
		const entityModelFactory = new EntityModelFactory();
		const entityModelData = entityModelFactory.make(1)[0];
		entityModelData.active = true;
		const entityModelResult = await createEntityModel(entityModelData);

		if (entityModelResult.success === false) {
			throw new Error("Failed to create Entity Model");
		}

		assert(entityModelResult.success === true);
	});

	test("Applies entity model validation correctly", async () => {
		const entityModelFactory = new EntityModelFactory();
		const entityModelData = entityModelFactory.make(1)[0];
		const entityModelResult = await createEntityModel(entityModelData);

		if (entityModelResult.success === false) {
			throw new Error("Failed to create Entity Model");
		}

		const missingNameEntityModel = entityModelFactory.make(1)[0];
		missingNameEntityModel.name = "";
		const missingNameEntityModelResult = await createEntityModel(missingNameEntityModel);

		assert(missingNameEntityModelResult.success === false);

		const duplicateIdsEntityModel = entityModelFactory.make(1)[0];
		duplicateIdsEntityModel.id = entityModelResult.data.id;
		duplicateIdsEntityModel.ref_id = entityModelResult.data.ref_id;
		duplicateIdsEntityModel.alt_id = entityModelResult.data.alt_id;
		const duplicateIdsEntityModelResult = await createEntityModel(duplicateIdsEntityModel);

		assert(duplicateIdsEntityModelResult.success === false);
	});
});
