<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const form = ref<{email: string, password: string}>({
	email: '',
	password: ''
});

const router = useRouter();

async function handleLogin() {
	
	const response = await fetch('/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(form.value)
	});

	if(response.ok) {
		router.push('/main');
	}
}

</script>

<template>
	<h1>Login</h1>
	<router-link to="/">Home</router-link>

	<div class="mt-4">
		<form class="flex flex-col gap-4" @submit.prevent="handleLogin">
			<div class="form-control">
				<label class="label">
					<span class="label-text">Email</span>
				</label>
				<input type="email" placeholder="Email" v-model="form.email" class="input input-bordered" />
			</div>
			<div class="form-control">
				<label class="label">
					<span class="label-text">Password</span>
				</label>
				<input type="password" placeholder="Password" v-model="form.password" class="input input-bordered" />
			</div>
			<button type="submit" class="btn btn-primary mt-4">Login</button>
		</form>
	</div>
</template>