import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { LoginParams, LoginResponse, User } from "./types";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		const saved = sessionStorage.getItem("user");

		if (!saved) {
			return null;
		}

		try {
			return JSON.parse(saved);
		} catch {
			sessionStorage.removeItem("user");
			return null;
		}
	});

	const [isLoading, setIsLoading] = useState(
		() =>
			sessionStorage.getItem("accessToken") !== null &&
			sessionStorage.getItem("user") === null,
	);

	const logout = useCallback(() => {
		sessionStorage.clear();
		setUser(null);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		const accessToken = sessionStorage.getItem("accessToken");
		const savedUser = sessionStorage.getItem("user");

		// No token, or user already loaded from sessionStorage.
		if (!accessToken || savedUser) {
			return;
		}

		const controller = new AbortController();

		getCurrentUser(accessToken, controller.signal)
			.then((currentUser) => {
				setUser(currentUser);
				sessionStorage.setItem("user", JSON.stringify(currentUser));
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
	}, [logout]);

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
		sessionStorage.setItem("refreshToken", data.refreshToken);

		const currentUser = await getCurrentUser(data.accessToken);

		sessionStorage.setItem("user", JSON.stringify(currentUser));
		sessionStorage.setItem("userGuid", currentUser.PublicGuid);

		setUser(currentUser);
		setIsLoading(false);
	}

	// Note: refresh endpoint returns properties in snake case
	const refreshAccessToken = useCallback(async (): Promise<string | null> => {
		const refreshToken = sessionStorage.getItem("refreshToken");

		if (!refreshToken) {
			return null;
		}

		const response = await fetch("/api/refresh", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				refreshToken,
			}),
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		sessionStorage.setItem("accessToken", data.access_token);
		sessionStorage.setItem(
			"accessTokenExpiresAt",
			String(Date.now() + data.expires_in * 1000),
		);

		if (data.refresh_token) {
			sessionStorage.setItem("refreshToken", data.refresh_token);
		}

		return data.access_token;
	}, []);

	const authenticatedFetch = useCallback(
		async <T,>(url: string, signal?: AbortSignal): Promise<T> => {
			let accessToken = sessionStorage.getItem("accessToken");
			const expiresAt = sessionStorage.getItem("accessTokenExpiresAt");

			if (!accessToken || !expiresAt) {
				logout();
				throw new Error("Session expired");
			}

			// Refresh if the token expires within 30 seconds
			if (Date.now() >= Number(expiresAt) - 30_000) {
				accessToken = await refreshAccessToken();

				if (!accessToken) {
					logout();
					throw new Error("Session expired");
				}
			}

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				signal,
			});

			if (response.status === 401) {
				logout();
				throw new Error("Session expired");
			}

			if (!response.ok) {
				const body = await response.text().catch(() => "");
				throw new Error(
					`Request to ${url} failed (${response.status}): ${body}`,
				);
			}

			return response.json() as Promise<T>;
		},
		[logout, refreshAccessToken],
	);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: user !== null,
				isLoading,
				login,
				logout,
				authenticatedFetch,
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
