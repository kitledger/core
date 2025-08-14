import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { entity_models } from "../../services/database/schema.ts";
import { InferOutput } from "@valibot/valibot";
import * as v from "@valibot/valibot";

export const EntityModelCreateSchema = v.object({
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullable(v.pipe(v.string(), v.maxLength(64))),
	name: v.string(),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type EntityModelInsert = InferInsertModel<typeof entity_models>;
export type EntityModel = InferSelectModel<typeof entity_models>;
export type EntityModelCreateData = InferOutput<typeof EntityModelCreateSchema>;
