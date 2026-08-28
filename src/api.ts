import type { LabDetail, LabSummary, LoginParams, SearchParams } from "./types";

async function getJson<T>(url: string): Promise<T> {
	const accessToken = sessionStorage.getItem("accessToken");
	const expiresAt = sessionStorage.getItem("accessTokenExpiresAt");
	if (!accessToken || !expiresAt || Date.now() >= Number(expiresAt)) {
		logout();
		throw new Error("Not logged in");
	}

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (res.status === 401) {
		logout();
		throw new Error("Your session has expired. Please log in again.");
	}

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Request to ${url} failed (${res.status}): ${body}`);
	}

	return res.json() as Promise<T>;
}

export function searchLabs(params: SearchParams): Promise<LabSummary[]> {
	const query = new URLSearchParams({
		lat: String(params.latitude),
		lng: String(params.longitude),
		radius: String(params.radiusInMeters),
		take: String(params.take),
	});
	return getJson<LabSummary[]>(`/api/labs/search?${query}`);
}

export function getLab(guid: string): Promise<LabDetail> {
	return getJson<LabDetail>(`/api/labs/${encodeURIComponent(guid)}`);
}

export async function login(params: LoginParams) {
	const { username, password } = params;

	const res = await fetch("/api/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			password,
		}),
	});

	const body = await res.json().catch(() => null);

	if (!res.ok) {
		throw new Error(body?.error || `Login failed`);
	}

	const { accessToken, expiresIn } = body;
	const expiresAt = Date.now() + expiresIn * 1000;
	sessionStorage.setItem("accessToken", accessToken);
	sessionStorage.setItem("accessTokenExpiresAt", expiresAt.toString());
}

export function logout() {
	sessionStorage.removeItem("accessToken");
	sessionStorage.removeItem("accessTokenExpiresAt");
	window.location.href = "/login";
}
