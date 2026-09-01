import { useEffect, useState, type ReactNode } from "react";
import type { LoginParams, LoginResponse, User } from "./types";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(
		() => sessionStorage.getItem("accessToken") !== null,
	);

	useEffect(() => {
		const accessToken = sessionStorage.getItem("accessToken");

		if (!accessToken) {
			return;
		}

		const controller = new AbortController();

		getCurrentUser(accessToken, controller.signal)
			.then((currentUser) => {
				setUser(currentUser);
				sessionStorage.setItem("userGuid", currentUser.PublicGuid);
				setIsLoading(false);
			})
			.catch(() => {
				if (controller.signal.aborted) return;
				logout();
			});

		return () => {
			controller.abort();
		};
	}, []);

	async function login(params: LoginParams) {
		const response = await fetch("/api/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(params),
		});

		if (!response.ok) {
			throw new Error("Login failed");
		}

		const data: LoginResponse = await response.json();
		const expiresAt = Date.now() + data.expiresIn * 1000;
		sessionStorage.setItem("accessToken", data.accessToken);
		sessionStorage.setItem("accessTokenExpiresAt", expiresAt.toString());

		const currentUser = await getCurrentUser(data.accessToken);

		sessionStorage.setItem("userGuid", currentUser.PublicGuid);
		setUser(currentUser);
		setIsLoading(false);
	}

	function logout() {
		sessionStorage.clear();
		setUser(null);
		setIsLoading(false);
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: user !== null,
				isLoading,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

async function getCurrentUser(
	accessToken: string,
	signal?: AbortSignal,
): Promise<User> {
	const response = await fetch("/api/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		signal,
	});

	if (!response.ok) {
		throw new Error("Unable to retrieve user");
	}

	return response.json();
}
