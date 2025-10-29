import Home from "./Home.vue";
import Login from "./auth/Login.vue";
import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";

const routes :RouteRecordRaw[] = [
	{ path: '/', component: Home },
	{ path: '/auth/login', component: Login },
	{
		path: '/:app',
		component: () => import('./app/AppLayout.vue'),
		children: [
			{ path: '/:app', component: () => import('./app/Dashboard.vue') }
		]	
	}
];

export const router = createRouter({
	history: createWebHistory('/app'),
	routes,
});