import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { unit_models } from "../../services/database/schema.ts";
import { InferOutput } from "@valibot/valibot";
import * as v from "@valibot/valibot";

export const UnitModelCreateSchema = v.object({
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullish(v.pipe(v.string(), v.maxLength(64)), null),
	name: v.string(),
	active: v.nullish(v.boolean(), true),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type UnitModelInsert = InferInsertModel<typeof unit_models>;
export type UnitModel = InferSelectModel<typeof unit_models>;
export type UnitModelCreateData = InferOutput<typeof UnitModelCreateSchema>;
