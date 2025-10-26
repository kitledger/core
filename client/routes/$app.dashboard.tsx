import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$app/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	return <div className="p-2">Hello from Dashboard!</div>;
}
