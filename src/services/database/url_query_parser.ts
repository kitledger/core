import { Column, Condition, ConditionGroup, Join, Order, Query } from "@kitledger/query";

// --- Valid Type Sets ---
const JOIN_TYPES: Set<string> = new Set(["inner", "left", "right", "full_outer"]);
const AGG_FUNCS: Set<string> = new Set(["sum", "avg", "count", "min", "max"]);
const ORDER_DIRECTIONS: Set<string> = new Set(["asc", "desc"]);

// Map short URL operators to their full schema names
const OPERATOR_MAP: Record<string, string> = {
	eq: "equal",
	neq: "not_equal",
	gt: "gt",
	gte: "gtequal",
	lt: "lt",
	lte: "ltequal",
	// All other operators (in, not_in, like, etc.) match their schema name
};

const RESERVED_PARAMS = new Set([
	"select",
	"join",
	"orderBy",
	"groupBy",
	"limit",
	"offset",
	"connector",
]);

function parseValue(val: string): string | number | boolean | (string | number | boolean)[] {
	if (val.includes(",")) {
		return val.split(",").map((v) => parseValue(v) as string | number | boolean);
	}
	if (val === "true") return true;
	if (val === "false") return false;
	if (!isNaN(Number(val)) && !isNaN(parseFloat(val))) {
		return Number(val);
	}
	return val;
}

function parseSelect(params: URLSearchParams): Column[] {
	const selects = params.getAll("select");
	if (selects.length === 0) {
		return [];
	}
	return selects.map((s) => {
		const [colPart, as] = s.split(":");
		const aggMatch = colPart.match(/(\w+)\((.*?)\)/);
		if (aggMatch) {
			const [, func, column] = aggMatch;
			if (!as) {
				throw new Error(`Aggregate select "${s}" must have an alias (e.g., ${s}:alias_name)`);
			}
			if (!AGG_FUNCS.has(func)) { // <-- VALIDATION
				throw new Error(`Invalid aggregate function: ${func}`);
			}
			return { func, column, as } as Column; // Cast is now safe
		}
		else if (as) {
			return { column: colPart, as } as Column; // Cast is now safe
		}
		else {
			return colPart as Column; // Cast is now safe
		}
	});
}

function parseOrderBy(params: URLSearchParams): Order[] {
	return params.getAll("orderBy").map((o) => {
		const parts = o.split(".");
		const lastPart = parts[parts.length - 1];
		let column: string;
		let direction: "asc" | "desc";

		if (ORDER_DIRECTIONS.has(lastPart)) { // <-- VALIDATION
			column = parts.slice(0, -1).join(".");
			direction = lastPart as "asc" | "desc";
		}
		else {
			column = o;
			direction = "asc"; // Default
		}

		if (column === "") {
			throw new Error(`Invalid orderBy value: ${o}`);
		}
		return { column, direction };
	});
}

function parseJoins(params: URLSearchParams): Join[] {
	return params.getAll("join").map((j) => {
		const parts = j.split(":");
		let type, table, as, onLeft, onRight;

		if (parts.length === 4) {
			[type, table, onLeft, onRight] = parts;
			as = undefined;
		}
		else if (parts.length === 5) {
			[type, table, as, onLeft, onRight] = parts;
		}
		else {
			throw new Error(`Invalid join syntax: ${j}`);
		}

		if (!JOIN_TYPES.has(type)) { // <-- VALIDATION
			throw new Error(`Invalid join type: ${type}`);
		}

		return {
			type,
			table,
			...(as && { as }),
			onLeft,
			onRight,
		} as Join; // Cast is now safe
	});
}

function parseWhere(params: URLSearchParams): ConditionGroup[] {
	const conditions: Condition[] = [];
	for (const [key, value] of params.entries()) {
		if (RESERVED_PARAMS.has(key)) continue;

		const column = key;
		const [opStr, valStr = ""] = value.split(/:(.*)/s);
		let parsedValue = parseValue(valStr);

		const operator = OPERATOR_MAP[opStr] || opStr;

		if (operator === "empty" || operator === "not_empty") {
			parsedValue = true;
		}

		// We cast here, and let Valibot do the heavy-lifting
		// validation of all possible operator/value combinations.
		conditions.push({ column, operator, value: parsedValue } as Condition);
	}

	if (conditions.length === 0) {
		return [];
	}

	const connector = params.get("connector") === "or" ? "or" : "and";
	return [{ connector, conditions }];
}

/**
 * Assembles a Kitledger Query object from URLSearchParams.
 * This now returns an object that conforms to the Query type.
 */
export function assembleQueryFromParams(params: URLSearchParams): Query {
	const limitParam = params.get("limit");
	const offsetParam = params.get("offset");

	// Parse all components
	const selects = parseSelect(params);
	const wheres = parseWhere(params);
	const joins = parseJoins(params);
	const orders = parseOrderBy(params);
	const groups = params.getAll("groupBy");

	// Build the query object, *only* adding optional keys if they are not empty.
	// This matches the v.optional() schema and will pass assertEquals.
	const query: Query = {
		select: selects,
		where: wheres,
		...(joins.length > 0 && { joins: joins }),
		...(orders.length > 0 && { orderBy: orders }),
		...(groups.length > 0 && { groupBy: groups }),
		...(limitParam && { limit: parseInt(limitParam, 10) }),
		...(offsetParam && { offset: parseInt(offsetParam, 10) }),
	};

	return query;
}
