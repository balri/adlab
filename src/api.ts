import type { LabDetail, LabSummary, SearchParams } from "./types";

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
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
