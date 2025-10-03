import { runMigrations } from "./services/database/db.ts";
import server from "./services/http/server.ts";
import { serverConfig } from "./config.ts";
import { execute } from "./cli.ts";
import { executeScript } from "./services/scripting/v1/js/runtime.ts";

await runMigrations();

// --- Test Script Execution ---

// This string represents a user's script that has already been transpiled
// from TypeScript to plain JavaScript by your CLI.
const preCompiledUserCode = `
    await kit.log.info('User script started. Processing event:', context);

    const response = await kit.http.get('https://api.mocki.io/v2/57310619/user-data');
    await kit.log.info('Simulated HTTP call successful. Response body:', response.body);

    await kit.log.audit('User event processing complete.');
`;

const contextData = JSON.stringify({ eventId: 'evt_simple_456', sourceType: 'test-run' });

console.log("--- Executing Kit Action Script ---");
// The executeScript call is now simpler, with no entry point.
const result = await executeScript(preCompiledUserCode, contextData);
console.log('--- Script Execution Finished ---');
console.log('Final Result:', result);
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