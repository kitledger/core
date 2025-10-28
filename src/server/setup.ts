import { createSuperUser } from "./domain/actions/user_actions.js";

type Command = {
    name: string;
    description: string;
    usage: string;
    handler: (args: string[]) => Promise<void> | void;
};

const commands: Command[] = [
    {
        name: "setup",
        description: "Setup a new super user",
        usage: "setup <first> <last> <email>",
        handler: async (args) => {
            if (args.length < 3) {
                console.error(`Usage: ${commands.find((c) => c.name === "setup")!.usage}`);
                process.exit(1);
            }

            const firstName = args[0];
            const lastName = args[1];
            const email = args[2];

            if (!firstName || !lastName || !email) {
                console.error("First name, last name, and email are required.");
                process.exit(1);
            }

			let user = null;

			try {
				user = await createSuperUser(firstName, lastName, email);
			} catch (error) {
				console.error("Error creating super user:", error);
				process.exit(1);
			}
            //const user = await createSuperUser(firstName, lastName, email);

            if (!user) {
                console.error("Failed to create super user.");
                process.exit(1);
            }

            console.table([user]);
            process.exit(0);
        },
    },
];

export async function execute(args: string[]): Promise<void> {
    const commandName = args[0];

    if (commandName === "help") {
        console.log("Available commands:");
        commands.forEach((cmd) => console.log(`- ${cmd.name}: ${cmd.description}`));
        console.log("- help: Show this help");
        process.exit(0);
    }

    const command = commands.find((cmd) => cmd.name === commandName);

    if (!command) {
        console.error(`Unknown command: ${commandName || ""}. Use "help" for available commands.`);
        process.exit(1);
    }

    if (args.length > 1 && (args[1] === "--help" || args[1] === "help")) {
        console.log(`Usage: ${command.usage}`);
        console.log(command.description);
        process.exit(0);
    }

    await command.handler(args.slice(1));
}