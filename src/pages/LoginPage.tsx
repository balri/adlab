import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function LoginPage() {
	const { login } = useAuth();
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
			<form className="login-form" onSubmit={handleSubmit}>
				<h1>Login</h1>

				<label htmlFor="username">
					Username
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
						required
					/>
				</label>

				<label htmlFor="password">
					Password
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
					/>
				</label>
				<p className="login-info">
					Please use your Geocaching username and password to sign in.
					<br />
					<br />
					🔒 Your username and password are sent securely to
					geocaching.com to authenticate your account. We do not store
					or retain your password.
				</p>
				{error && <p className="error-text">{error}</p>}

				<button type="submit" className="btn" disabled={loading}>
					{loading ? "Logging in..." : "Log in"}
				</button>
			</form>
		</div>
	);
}
