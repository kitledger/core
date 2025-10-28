import KlIcon from "../assets/brand/vector.svg";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
	ActionIcon,
	AppShell,
	Avatar,
	Badge,
	Box,
	Burger,
	Button,
	Divider,
	Group,
	Image,
	Kbd,
	Menu,
	NavLink,
	rem,
	ScrollArea,
	Space,
	Text,
	UnstyledButton,
	useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	IconBuildingStore,
	IconChevronDown,
	IconDashboard,
	IconDeviceDesktop,
	IconFileText,
	IconGauge,
	IconInbox,
	IconLogout,
	IconMoon,
	IconPackage,
	IconReportMoney,
	IconSearch,
	IconSettings,
	IconSun,
	IconUserCircle,
	IconUsers,
} from "@tabler/icons-react";
import { Spotlight, spotlight, SpotlightActionData } from "@mantine/spotlight";
import { authUserQueryOptions } from "../data/auth";
import { useQuery } from "@tanstack/react-query";

// --- TanStack Router Route Definition ---
export const Route = createFileRoute("/$app")({
	component: AppLayout,
	beforeLoad: async ({context}) => {

		try {
			const response = await context.queryClient.ensureQueryData(authUserQueryOptions);

			console.log("User data in beforeLoad:", response);

			if (!response) {
				throw "No user data";
			}
		}

		catch (_e) {
			throw redirect({
				to: "/accounts/login",
			});
		}
	}
});

function ThemeSwitcher() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	// Select the correct icon for the button based on the current theme
	const icon = colorScheme === "dark"
		? <IconMoon style={{ width: rem(18), height: rem(18) }} />
		: colorScheme === "light"
		? <IconSun style={{ width: rem(18), height: rem(18) }} />
		: <IconDeviceDesktop style={{ width: rem(18), height: rem(18) }} />;

	return (
		<Menu shadow="md" width={120} position="top-end" withArrow>
			<Menu.Target>
				{/* Use ActionIcon as the trigger for a compact button */}
				<ActionIcon variant="default" size="lg" aria-label="Toggle theme">
					{icon}
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item
					leftSection={<IconSun style={{ width: rem(14), height: rem(14) }} />}
					onClick={() => setColorScheme("light")}
				>
					Light
				</Menu.Item>
				<Menu.Item
					leftSection={<IconMoon style={{ width: rem(14), height: rem(14) }} />}
					onClick={() => setColorScheme("dark")}
				>
					Dark
				</Menu.Item>
				<Menu.Item
					leftSection={<IconDeviceDesktop style={{ width: rem(14), height: rem(14) }} />}
					onClick={() => setColorScheme("auto")}
				>
					Auto
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

// --- 1. AppSwitcher (Modified for sidebar) ---
function AppSwitcher() {
	return (
		<Menu shadow="md" width="target">
			<Menu.Target>
				<Button
					variant="default"
					rightSection={<IconChevronDown style={{ width: rem(14), height: rem(14) }} />}
					leftSection={<IconBuildingStore style={{ width: rem(14), height: rem(14) }} />}
					fullWidth // Makes it fit the sidebar
				>
					Inventory App
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Switch App</Menu.Label>
				<Menu.Item
					leftSection={<IconBuildingStore style={{ width: rem(14), height: rem(14) }} />}
				>
					Inventory App
				</Menu.Item>
				<Menu.Item
					leftSection={<IconReportMoney style={{ width: rem(14), height: rem(14) }} />}
				>
					Sales App
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
				>
					Main (Admin)
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

// --- 2. Spotlight Button (New component) ---
// This component looks like a search bar and triggers the spotlight
function SpotlightButton() {
	return (
		<Button
			variant="default"
			leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
			rightSection={
				<Kbd size="xs" style={{ fontSize: "10px" }}>
					⌘+K
				</Kbd>
			}
			justify="space-between"
			fullWidth
			onClick={spotlight.open}
			c="dimmed"
			fw="normal"
		>
			Search...
		</Button>
	);
}

// --- 3. Main Navigation (Replaces MegaMenu) ---
// This component provides the multi-level sidebar navigation
function MainNavigation() {
	return (
		<>
			<Text size="xs" c="dimmed" fw={500} tt="uppercase" pb="xs">
				Modules
			</Text>
			<NavLink
				label="Dashboard"
				leftSection={<IconGauge style={{ width: rem(16), height: rem(16) }} />}
				active
			/>
			<NavLink
				label="Inventory"
				leftSection={<IconPackage style={{ width: rem(16), height: rem(16) }} />}
				childrenOffset={28}
			>
				<NavLink label="Items" />
				<NavLink label="Adjustments" />
				<NavLink label="Warehouses" />
			</NavLink>
			<NavLink
				label="Sales"
				leftSection={<IconUsers style={{ width: rem(16), height: rem(16) }} />}
				childrenOffset={28}
			>
				<NavLink label="Customers" />
				<NavLink label="Sales Orders" />
			</NavLink>
		</>
	);
}

// --- 4. UserMenu (Modified for sidebar) ---
// Simplified to always show the full version inside the sidebar
function UserMenu() {

	const userData = useQuery(authUserQueryOptions);

	return (
		userData.isLoading ?
			<div>Loading...</div> :
			<Menu shadow="md" width={240} position="top-end" withArrow>
				<Menu.Target>
					<UnstyledButton w="100%">
						<Group gap="sm">
							<Avatar src={null} alt={`${userData.data?.first_name} ${userData.data?.last_name}`} color="initials" name={`${userData.data?.first_name} ${userData.data?.last_name}`}></Avatar>
							<div style={{ flex: 1, minWidth: 0 }}>
								<Text size="sm" fw={500} truncate>
									{userData.data?.first_name} {userData.data?.last_name}
								</Text>
								<Text c="dimmed" size="xs" truncate>
									{userData.data?.email}
								</Text>
							</div>
							<IconChevronDown style={{ width: rem(14), height: rem(14) }} />
						</Group>
					</UnstyledButton>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Label>Account</Menu.Label>
					<Menu.Item
						leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}
					>
						Profile
					</Menu.Item>
					<Menu.Item
						leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
					>
						Settings
					</Menu.Item>
					<Menu.Divider />
					<Menu.Item
						color="red"
						leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
					>
						Sign Out
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>
	);
}

// --- 5. Spotlight Actions ---
const spotlightActions: SpotlightActionData[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		description: "Go to the main dashboard",
		onClick: () => console.log("Navigate to Dashboard"),
		leftSection: <IconDashboard size={24} stroke={1.5} />,
	},
	{
		id: "new-adjustment",
		label: "New Inventory Adjustment",
		description: "Create a new inventory adjustment",
		onClick: () => console.log("Navigate to New Adjustment"),
		leftSection: <IconFileText size={24} stroke={1.5} />,
	},
];

// --- 6. Main AppLayout (Refactored) ---
export function AppLayout() {
	const [opened, { toggle }] = useDisclosure();
	const clientName = "Client's Company Name";
	const accountType = "dev"; // Can be 'dev', 'test', or 'prod'
	const accountTypeInfo = {
		dev: { color: "orange", label: "Development" },
		test: { color: "blue", label: "Testing" },
		prod: { color: "green", label: "Production" },
	}[accountType];

	return (
		<>
			<AppShell
				// Header is now ONLY for mobile, to hold the burger
				header={{ height: { base: 60, sm: 0 } }}
				// Navbar is now permanent on desktop, toggled on mobile
				navbar={{
					width: 240, // A slightly sleeker width
					breakpoint: "sm",
					collapsed: { desktop: false, mobile: !opened },
				}}
				padding="md"
			>
				{/* --- Mobile-Only Header --- */}
				<AppShell.Header hiddenFrom="sm">
					<Group h="100%" px="md" justify="space-between">
						<Group>
							<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
							<Image
								src={KlIcon}
								w={rem(28)}
								h={rem(28)}
								alt="Kitledger Logo"
							/>
							
						</Group>
						<Text fw={600} size="sm" truncate>
							{clientName}
						</Text>
					</Group>
				</AppShell.Header>

				{/* --- Main Sidebar Navigation --- */}
				<AppShell.Navbar p={0}>
					{/* --- NEW: Account Type Indicator Badge --- */}
					<Badge
						fullWidth
						variant="filled"
						color={accountTypeInfo.color}
						radius={0}
						tt="uppercase"
						style={{ letterSpacing: "0.05em" }}
					>
						{accountTypeInfo.label}
					</Badge>

					{/* --- NEW: Wrapper Box to re-apply padding and layout --- */}
					<Box
						style={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							overflow: "hidden",
						}}
						p="md"
					>
						{/* 1. Top Section: Logo, App Switcher, Search */}
						<AppShell.Section>
							{/* --- MODIFIED: Logo + Client Name Box --- */}
							<Group visibleFrom="sm" gap="xs" wrap="nowrap" align="center">
								{/* Kitledger Logo (Placeholder) */}

								<Image
									src={KlIcon}
									w={rem(32)}
									h={rem(32)}
									alt="Kitledger Logo"
								/>

								{/* Client Name/Logo Box (Theme-aware "grey box") */}
								<Box
									style={{
										flex: 1,
										minWidth: 0,
										display: "flex", // <-- ADD: Make the box a flex container
										alignItems: "center", // <-- ADD: Vertically center its children
									}}
									bg="var(--mantine-color-body-hover)"
									px="sm"
									h={32}
									// lh={rem(32)} // <-- REMOVE
									bdrs="sm"
								>
									<Text fw={600} size="sm" truncate>
										{clientName}
									</Text>
								</Box>
							</Group>

							<Space h="md" />
							<AppSwitcher />
							<Space h="md" />
							<SpotlightButton />
						</AppShell.Section>

						{/* 2. Middle Section: Scrollable Navigation */}
						<AppShell.Section grow my="md" component={ScrollArea}>
							<MainNavigation />
						</AppShell.Section>

						{/* 3. Bottom Section: Inbox & User Menu */}
						<AppShell.Section>
							<Divider my="sm" />
							<Group gap="xs" justify="space-between" wrap="nowrap">
								<Button
									variant="default"
									leftSection={<IconInbox style={{ width: rem(16), height: rem(16) }} />}
									justify="flex-start"
									style={{ flex: 1 }}
								>
									Inbox
								</Button>
								<ThemeSwitcher />
							</Group>
							<Space h="md" />
							<UserMenu />
						</AppShell.Section>
					</Box>
				</AppShell.Navbar>

				{/* --- Main Content Area --- */}
				<AppShell.Main>
					<Outlet />
				</AppShell.Main>
			</AppShell>

			{/* --- Spotlight Component (Unchanged) --- */}
			<Spotlight
				actions={spotlightActions}
				nothingFound="Nothing found..."
				highlightQuery
				limit={7}
				shortcut={["mod + k", "/"]}
				searchProps={{
					leftSection: <IconSearch size={20} stroke={1.5} />,
					placeholder: "Search Kitledger...",
				}}
			/>
		</>
	);
}
