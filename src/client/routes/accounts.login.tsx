import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute('/accounts/login')({
	component: LoginPage,
});

async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
	event.preventDefault();
	const formData = new FormData(event.currentTarget);
	const email = formData.get('email');
	const password = formData.get('password');
	
	// Handle login logic here
	const response = await fetch('/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
	})

	console.log('Login submitted:', { email, password });
	console.log('Response:', await response.json());
}

function LoginPage() {
	return <>
		<h1>Login Page</h1>
		<form onSubmit={handleSubmit}>
			<label>
				Email:
				<input type="email" name="email" />
			</label>
			<br />
			<label>
				Password:
				<input type="password" name="password" />
			</label>
			<br />
			<button type="submit">Login</button>
		</form>
	</>
}