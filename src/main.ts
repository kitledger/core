import { runMigrations } from "./services/database/db.ts";
import server from "./services/http/server.ts";
import { serverConfig } from "./config.ts";
import { execute } from "./cli.ts";
import { executeScript } from "./services/scripting/v1/js/runtime.ts";

await runMigrations();

const userCode = `
    console.log("Starting user script.");
    const newInvoice = await kit.billing.invoices.create({ customerId: 'cust-123', amount: 4999 });
    await kit.utils.log("Invoice created successfully!", newInvoice);
    console.log("User script finished.");
`;

const contextData = JSON.stringify({ userId: 'user-abc', permissions: [] });
const result = await executeScript(userCode, contextData);
console.log('Execution Result:', result);

const args = Deno.args;

if (args.length === 0 || args[0] === "serve") {
	console.log(`Server is running on port ${serverConfig.port}`);
	Deno.serve(
		{ port: serverConfig.port },
		server.fetch,
	);
}
else {
	await execute(args);
}
