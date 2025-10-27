import { createFileRoute, Link } from "@tanstack/react-router";
import { useDisclosure } from '@mantine/hooks';
import { AppShell, Group, Burger } from "@mantine/core";

export const Route = createFileRoute("/")({
	component: Index,
	loader: async () => {
		const response = await fetch("/api/v1/accounts");
		console.log(await response.clone().json());
		return await response.json();
	},
});

export function Index() {
	const [opened, { toggle }] = useDisclosure();
	return (
		<AppShell
		header={{ height: 60 }}
		padding="md"
		>
		<AppShell.Header>
			<Group h="100%" px="md">
			<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
				Header has a burger icon below sm breakpoint
			</Group>
		</AppShell.Header>
		<AppShell.Main>
			<div>
				<Link
					to="/$app/dashboard"
					params={{ app: "main" }}
				>
					App
				</Link>
				<Link to="/accounts/login">Login</Link>
			</div>
		</AppShell.Main>
		</AppShell>
	);
}
