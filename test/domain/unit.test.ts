import assert from "node:assert";
import { after, describe, test } from "node:test";
import { db } from "../../src/server/services/database/db.js";
import { UnitModelFactory } from "../../src/server/domain/factories/unit_factories.js";
import { createUnitModel } from "../../src/server/domain/actions/unit_model_actions.js";

describe("Unit Domain Tests", () => {
	after(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	test("Can create a valid unit model", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		unitModelData.active = true;
		const unitModelResult = await createUnitModel(unitModelData);

		if (unitModelResult.success === false) {
			throw new Error("Failed to create Unit Model");
		}

		assert(unitModelResult.success === true);
	});

	test("Applies unit model validation correctly", async () => {
		const unitModelFactory = new UnitModelFactory();
		const unitModelData = unitModelFactory.make(1)[0];
		const unitModelResult = await createUnitModel(unitModelData);

		if (unitModelResult.success === false) {
			throw new Error("Failed to create Unit Model");
		}

		const missingNameUnitModel = unitModelFactory.make(1)[0];
		missingNameUnitModel.name = "";
		const missingNameUnitModelResult = await createUnitModel(missingNameUnitModel);

		assert(missingNameUnitModelResult.success === false);

		const duplicateIdsUnitModel = unitModelFactory.make(1)[0];
		duplicateIdsUnitModel.id = unitModelResult.data.id;
		duplicateIdsUnitModel.ref_id = unitModelResult.data.ref_id;
		duplicateIdsUnitModel.alt_id = unitModelResult.data.alt_id;
		const duplicateIdsUnitModelResult = await createUnitModel(duplicateIdsUnitModel);

		assert(duplicateIdsUnitModelResult.success === false);
	});
});
