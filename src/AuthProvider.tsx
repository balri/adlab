import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { LoginParams, LoginResponse, User } from "./types";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		const saved = localStorage.getItem("user");

		if (!saved) {
			return null;
		}

		try {
			return JSON.parse(saved);
		} catch {
			localStorage.removeItem("user");
			return null;
		}
	});

	const [isLoading, setIsLoading] = useState(
		() =>
			localStorage.getItem("accessToken") !== null &&
			localStorage.getItem("user") === null,
	);

	const logout = useCallback(() => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("accessTokenExpiresAt");
		localStorage.removeItem("user");
		localStorage.removeItem("userGuid");
		setUser(null);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		const accessToken = localStorage.getItem("accessToken");
		const savedUser = localStorage.getItem("user");

		// No token, or user already loaded from localStorage.
		if (!accessToken || savedUser) {
			return;
		}

		const controller = new AbortController();

		getCurrentUser(accessToken, controller.signal)
			.then((currentUser) => {
				setUser(currentUser);
				localStorage.setItem("user", JSON.stringify(currentUser));
				localStorage.setItem("userGuid", currentUser.PublicGuid);
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

		localStorage.setItem("accessToken", data.accessToken);
		localStorage.setItem("accessTokenExpiresAt", expiresAt.toString());

		const currentUser = await getCurrentUser(data.accessToken);

		localStorage.setItem("user", JSON.stringify(currentUser));
		localStorage.setItem("userGuid", currentUser.PublicGuid);

		setUser(currentUser);
		setIsLoading(false);
	}

	const refreshAccessToken = useCallback(async (): Promise<string | null> => {
		const response = await fetch("/api/refresh", {
			method: "POST",
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		localStorage.setItem("accessToken", data.accessToken);
		localStorage.setItem(
			"accessTokenExpiresAt",
			String(Date.now() + data.expiresIn * 1000),
		);

		return data.accessToken;
	}, []);

	const authenticatedFetch = useCallback(
		async <T,>(url: string, signal?: AbortSignal): Promise<T> => {
			let accessToken = localStorage.getItem("accessToken");
			const expiresAt = localStorage.getItem("accessTokenExpiresAt");

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
