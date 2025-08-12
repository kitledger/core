import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { unit_models } from "../../services/database/schema.ts";

export type UnitModelInsert = InferInsertModel<typeof unit_models>;
export type UnitModel = InferSelectModel<typeof unit_models>;
