import * as v from "@valibot/valibot";
import { BaseMetaProperty } from "../base/base_schema.ts";

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

export type Account = {
	id: string;
	ref_id: string;
	alt_id?: string | null | undefined;
	balance_type: BalanceType;
	ledger_id: string;
	parent_id?: string | null | undefined;
	name: string;
	meta: BaseMetaProperty;
	active: boolean;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
}