import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$app")({
	component: AppLayout,
});

/**
 * Represents the shared navigation content for both mobile and desktop sidebars.
 * @param {boolean} isCollapsed - If true, only icons will be shown.
 */
function SidebarNav({ isCollapsed = false }: { isCollapsed?: boolean }) {
	const navItems = [
		{ name: "Dashboard", href: "#", current: true },
		{ name: "Accounts", href: "#", current: false },
		{ name: "Reports", href: "#", current: false },
	];

	return (
		<nav className="flex flex-col gap-1">
			{navItems.map((item) => (
				<a
					key={item.name}
					href={item.href}
					className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
            transition-colors
            ${
						item.current
							? "bg-secondary text-secondary-foreground"
							: "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
					}
            ${isCollapsed ? "justify-center" : ""}`}
				>
					<span className={isCollapsed ? "lg:hidden" : ""}>{item.name}</span>
				</a>
			))}
		</nav>
	);
}

/**
 * The main application shell component.
 */
export function AppLayout() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

	return (
		<div className="flex h-dvh w-full bg-background text-foreground font-sans">
			<Dialog
				open={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
				className="relative z-50 lg:hidden"
			>
				<DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

				{/* Dialog panel (the sidebar itself) */}
				<DialogPanel className="fixed inset-y-0 left-0 flex w-64 max-w-[calc(100vw-4rem)] flex-col bg-card border-r border-border p-4">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-primary">Kitledger App</h2>
						<button
							type="button"
							onClick={() => setIsMobileMenuOpen(false)}
							className="p-1 rounded-md text-muted-foreground hover:bg-secondary"
						>
							<p className="sr-only">Close menu</p>
						</button>
					</div>
					<SidebarNav />
				</DialogPanel>
			</Dialog>

			<aside
				className={`hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ${
					isDesktopCollapsed ? "w-20" : "w-64"
				}`}
			>
				{/* Logo/Title Area */}
				<div className="flex h-16 items-center border-b border-border px-4">
					<h2
						className={`text-lg font-semibold text-primary overflow-hidden transition-opacity ${
							isDesktopCollapsed ? "opacity-0 w-0" : "opacity-100"
						}`}
					>
						Kitledger App
					</h2>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					<SidebarNav isCollapsed={isDesktopCollapsed} />
				</div>

				{/* Collapse Toggle Button */}
				<div className="p-4 border-t border-border">
					<button
						type="button"
						onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
						className="w-full flex items-center justify-center gap-3 rounded-md px-3 py-2
                       text-sm font-medium text-muted-foreground
                       hover:bg-secondary hover:text-secondary-foreground"
					>
						{isDesktopCollapsed ? <p>Expand</p> : <p>Collapse</p>}
						<span className={isDesktopCollapsed ? "lg:hidden" : ""}>
							Collapse
						</span>
					</button>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col">
				<main className="flex-1 overflow-y-auto p-4 lg:p-8">
					{/* Page Title */}
					<h1 className="text-3xl font-bold text-foreground mb-6">
						Dashboard
					</h1>

					{/* Page Content */}
					<div className="bg-card border border-border rounded-lg shadow-sm">
						<div className="p-6">
							<Outlet></Outlet>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
