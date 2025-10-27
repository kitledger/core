import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export const Route = createFileRoute("/$app")({
	component: AppLayout,
});

/**
 * The main application shell component.
 */
export function AppLayout() {

	const [opened, { toggle }] = useDisclosure();

	return (
		<AppShell
		header={{ height: 60 }}
		navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
		padding="md"
		>
		<AppShell.Header>
			<Group h="100%" px="md">
			<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
			Header has a burger icon below sm breakpoint
			</Group>
		</AppShell.Header>
		<AppShell.Navbar p="md">
			Navbar is collapsed on mobile at sm breakpoint. At that point it is no longer offset by
			padding in the main element and it takes the full width of the screen when opened.
		</AppShell.Navbar>
		<AppShell.Main>
			<Outlet />
		</AppShell.Main>
		</AppShell>
	);
}