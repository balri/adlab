import type { LabDetail, LabSummary, LoginParams, SearchParams } from "./types";

async function getJson<T>(url: string): Promise<T> {
	const accessToken = sessionStorage.getItem("accessToken");
	if (!accessToken) {
		throw new Error("Not logged in");
	}

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

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

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Request to login failed (${res.status}): ${body}`);
	}

	const { accessToken } = await res.json();
	sessionStorage.setItem("accessToken", accessToken);
}
