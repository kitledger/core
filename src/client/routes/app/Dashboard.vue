<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(async () => {

	const response = await fetch('/api/v1/user');
	const data = await response.json();

	console.table(data);
});

</script>

<template>
	<h1>Dashboard</h1>	
</template>