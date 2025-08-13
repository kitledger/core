import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { transaction_models } from "../../services/database/schema.ts";

export type TransactionModelInsert = InferInsertModel<typeof transaction_models>;
export type TransactionModel = InferSelectModel<typeof transaction_models>;
