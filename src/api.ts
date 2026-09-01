import type { LabDetail, LabSummary, SearchParams } from "./types";

function redirectToLogin() {
	sessionStorage.clear();
	window.location.replace("/login");
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
	const accessToken = sessionStorage.getItem("accessToken");
	const expiresAt = sessionStorage.getItem("accessTokenExpiresAt");

	if (!accessToken || !expiresAt || Date.now() >= Number(expiresAt)) {
		redirectToLogin();
		throw new Error("Session expired");
	}

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		signal,
	});

	if (res.status === 401) {
		redirectToLogin();
		throw new Error("Session expired");
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
	params.statuses.forEach((status) => {
		query.append("statuses", status);
	});

	return getJson<LabSummary[]>(`/api/labs/search?${query}`);
}

export async function getLab(
	guid: string,
	signal?: AbortSignal,
): Promise<LabDetail> {
	return getJson<LabDetail>(`/api/labs/${encodeURIComponent(guid)}`, signal);
}
