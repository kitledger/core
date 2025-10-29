<script setup lang="ts">
	import { RouterView } from 'vue-router';
</script>

<template>
	<div class="flex gap-2">
		<div>
			<h1>App Layout</h1>
		</div>
		<div>
			<router-view></router-view>
		</div>
	</div>
	<RouterView />
</template>