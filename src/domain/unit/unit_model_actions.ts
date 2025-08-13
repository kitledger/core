import { UnitModelCreateSchema, UnitModelCreateData, UnitModelInsert } from "./types.ts";
import * as v from "@valibot/valibot";
import { parseValibotIssues, ValidationError, ValidationResult } from "../base/validation.ts";
import { db } from "../../services/database/db.ts";
import { unit_models } from "../../services/database/schema.ts";
import { eq } from "drizzle-orm";

export async function refIdAlreadyExists(refId: string): Promise<boolean> {
	const results = await db.query.unit_models.findMany({
		where: eq(unit_models.ref_id, refId),
		columns: { id: true },
	});
	return results.length > 0;
}

export async function altIdAlreadyExists(altId: string|null): Promise<boolean> {
	if (!altId) {
		return false;
	}
	const results = await db.query.unit_models.findMany({
		where: eq(unit_models.alt_id, altId),
		columns: { id: true },
	});
	return results.length > 0;
}

export async function validateUnitModelCreate(data: UnitModelCreateData): Promise<ValidationResult<UnitModelInsert>> {
	const result = v.safeParse(UnitModelCreateSchema, data);
	let success = result.success;

	if(!result.success)
	{
		return {
			success: false,
			errors: parseValibotIssues(result.issues)
		};
	}

	const errors: ValidationError[] = [];

	const [refIdError, altIdError] = await Promise.all([
		refIdAlreadyExists(data.ref_id),
		altIdAlreadyExists(data.alt_id)
	]);

	if (refIdError) {
		success = false;
		errors.push({
			type: "data",
			path: "ref_id",
			message: "Ref ID already exists.",
		});
	}

	if (altIdError) {
		success = false;
		errors.push({
			type: "data",
			path: "alt_id",
			message: "Alt ID already exists.",
		});
	}

	return {
		success: success,
		data: result.output,
		errors: errors
	}
};

export async function createUnitModel(data: UnitModelCreateData): Promise<string | ValidationResult<UnitModelInsert>> {
	const validation = await validateUnitModelCreate(data);

	if (!validation.success || !validation.data) {
		return {
			success: false,
			data: data,
			errors: validation.errors
		}
	}

	const result = await db.insert(unit_models).values(validation.data).returning();

	return result.length > 0 ? result[0].id : {
		success: false,
		data: validation.data,
		errors: [{
			type: "data",
			path: "unknown",
			message: "Failed to create unit model."
		}]
	};
}