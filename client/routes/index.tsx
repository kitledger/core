import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Index,
	loader: async () => {
		const response = await fetch("/api/v1/accounts");
		console.log(await response.clone().json());
		return await response.json();
	},
});

export function Index() {
	return (
		<div>
			<Link
				to="/$app/dashboard"
				params={{ app: "main" }}
			>
				App
			</Link>
			<Link to="/accounts/login">Login</Link>
		</div>
	);
}
