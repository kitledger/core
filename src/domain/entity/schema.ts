import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { entity_models } from "../../services/database/schema.ts";

export type EntityModelInsert = InferInsertModel<typeof entity_models>;
export type EntityModel = InferSelectModel<typeof entity_models>;
