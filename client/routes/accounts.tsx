import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts")({
	component: Accounts,
});

export function Accounts() {
	return (
		<Outlet></Outlet>
	);
}