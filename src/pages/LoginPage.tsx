import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";

export default function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const from = location.state?.from?.pathname ?? "/";

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setError("");
		setLoading(true);

		try {
			await login({ username, password });
			navigate(from, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-page">
			<h1>Login</h1>

			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="username">Username</label>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
						required
					/>
				</div>

				<div>
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
					/>
				</div>

				{error && <p>{error}</p>}

				<button type="submit" disabled={loading}>
					{loading ? "Logging in..." : "Log in"}
				</button>
			</form>
		</div>
	);
}
