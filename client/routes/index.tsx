import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Index,
	loader: async () => {
		const response = await fetch("/api/v1/accounts");
		console.log(await response.clone().json());
		return await response.json();
	},
});

function Index() {
	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
		</div>
	);
}
