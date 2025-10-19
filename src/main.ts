import { runMigrations } from "./services/database/db.ts";
import server from "./services/http/server.ts";
import { serverConfig } from "./config.ts";
import { execute } from "./cli.ts";
import { executeScript } from "./services/scripting/runtime.ts";

await runMigrations();

// --- Test Script Execution ---

const preCompiledUserCode = `
    // --- Bundled @kitledger/api Library ---
    const __kit_rpc = (methodName, args) => {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            
            const payload = { id, methodName, args };
            
            const responseHandler = (event) => {
                if (event.data && 
                    event.data.type === "actionResponse" && 
                    event.data.payload.id === id) 
                {
                    self.removeEventListener("message", responseHandler);
                    const { result, error } = event.data.payload;
                    error ? reject(new Error(error)) : resolve(result);
                }
            };
            
            self.addEventListener("message", responseHandler);
            self.postMessage({ type: "actionRequest", payload });
        });
    };

    const unit_model = {
        create: (...args) => __kit_rpc('UNIT_MODEL.CREATE', args),
    };
    // --- End of Bundled Library ---


    // --- User's Script ---
    console.log('User script started. Context:', context);

    const newData = {
        name: 'Kilogram',
        type: 'MASS',
        symbol: 'kg',
    };

    const result = await unit_model.create(newData);

    console.log('API call finished. Result:', result);
`;

const contextData = JSON.stringify({ eventId: "evt_unit_model_test_789" });

console.log("--- Executing Kit Action Script (Simplified) ---");
const result = await executeScript(preCompiledUserCode, contextData);
console.log("--- Script Execution Finished ---");
console.log("Final Result:", result);
console.log("---------------------------------");

// --- Server and CLI Startup Logic ---

const args = Deno.args;

if (args.length === 0 || args[0] === "serve") {
	console.log(`Server is running on port ${serverConfig.port}`);
	Deno.serve(
		{ port: serverConfig.port },
		server.fetch,
	);
} else {
	await execute(args);
}