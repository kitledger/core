/**
 * Sample query execution to demonstrate the executeQuery function.
 */
/*const queryParams: Query = {
	select: [
		{ column: "accounts.id", as: "account_id" },
		{ column: "parent.name", as: "parent_name" },
	],
	joins: [
		{
			type: "left",
			table: "accounts",
			as: "parent",
			onLeft: "accounts.parent_id",
			onRight: "parent.id",
		}
	],
	where: [
		{
			connector: "and",
			conditions: [
				// This condition correctly finds all accounts that have a parent
				{ column: "accounts.parent_id", operator: "not_empty", value: true },
			],
		}
	],
	orderBy: [
		{ column: "accounts.created_at", direction: "desc" },
	],
};*/