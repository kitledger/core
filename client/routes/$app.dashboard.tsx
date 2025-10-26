import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$app/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	return <div>Hello from Dashboard!</div>;
}
