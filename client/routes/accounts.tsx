import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts")({
	component: Accounts,
});

export function Accounts() {
	return (
		<div className="min-h-screen bg-background text-foreground font-sans p-4 sm:p-8">
			<div className="max-w-5xl mx-auto">
				<main>
					<Outlet></Outlet>
				</main>
			</div>
		</div>
	);
}