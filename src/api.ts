import type { LabDetail, LabSummary, SearchParams } from "./types";

async function getJson<T>(url: string): Promise<T> {
	const accessToken = sessionStorage.getItem("accessToken");
	const expiresAt = sessionStorage.getItem("accessTokenExpiresAt");
	if (!accessToken || !expiresAt || Date.now() >= Number(expiresAt)) {
		throw new Error("Not logged in");
	}

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (res.status === 401) {
		throw new Error("Your session has expired. Please log in again.");
	}

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Request to ${url} failed (${res.status}): ${body}`);
	}

	return res.json() as Promise<T>;
}

export async function searchLabs(params: SearchParams): Promise<LabSummary[]> {
	const query = new URLSearchParams({
		lat: String(params.latitude),
		lng: String(params.longitude),
		radius: String(params.radiusInMeters),
		take: String(params.take),
	});
	return getJson<LabSummary[]>(`/api/labs/search?${query}`);
}

export async function getLab(guid: string): Promise<LabDetail> {
	return getJson<LabDetail>(`/api/labs/${encodeURIComponent(guid)}`);
}
