<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
	<h1>Home</h1>
	<router-link to="/main">Go to Dashboard</router-link>
	<router-link to="/auth/login">Login</router-link>
</template>