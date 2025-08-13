import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as v from "@valibot/valibot";
import { InferOutput } from "@valibot/valibot";
import { accounts, ledgers } from "../../services/database/schema.ts";

export enum BalanceType {
	DEBIT = "debit",
	CREDIT = "credit",
}

export const AccountCreateSchema = v.object({
	id: v.pipe(v.string(), v.uuid()),
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullish(v.pipe(v.string(), v.maxLength(64))),
	balance_type: v.enum(BalanceType),
	ledger_id: v.string(),
	parent_id: v.optional(v.nullable(v.string())),
	name: v.string(),
	meta: v.record(v.string(), v.union([v.string(), v.number(), v.date()])),
	active: v.boolean(),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type AccountInsert = InferInsertModel<typeof accounts>;
export type Account = InferSelectModel<typeof accounts>;
export type AccountCreateData = InferOutput<typeof AccountCreateSchema>;

export const LedgerCreateSchema = v.object({
	id: v.pipe(v.string(), v.uuid()),
	ref_id: v.pipe(v.string(), v.maxLength(64)),
	alt_id: v.nullish(v.pipe(v.string(), v.maxLength(64))),
	name: v.string(),
	description: v.nullable(v.string()),
	unit_type_id: v.string(),
	active: v.boolean(),
	created_at: v.optional(v.date()),
	updated_at: v.optional(v.nullable(v.date())),
});

export type LedgerInsert = InferInsertModel<typeof ledgers>;
export type Ledger = InferSelectModel<typeof ledgers>;
export type LedgerCreateData = InferOutput<typeof LedgerCreateSchema>;
