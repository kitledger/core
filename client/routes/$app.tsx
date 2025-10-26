import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$app")({
	component: AppLayout,
});

/**
 * The main application shell component.
 */
export function AppLayout() {

	return (
		<Outlet />
	);
}
