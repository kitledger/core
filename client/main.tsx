import "@mantine/core/styles.css";
import "@mantine/spotlight/styles.css";
import "./style.css";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createTheme, MantineProvider } from "@mantine/core";

// Import the generated route tree
import { routeTree } from "./routeTree.gen.ts";

// Create a client for React Query
const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({ routeTree, basepath: "/app" });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Mantine theme (optional)
const theme = createTheme({
	primaryColor: "green",
	fontFamily:
		'"IBM Plex Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans"',
	fontFamilyMonospace:
		'"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
	primaryShade: {
		light: 6,
		dark: 5,
	},
});

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<MantineProvider theme={theme} defaultColorScheme="auto">
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</MantineProvider>
		</StrictMode>,
	);
}
