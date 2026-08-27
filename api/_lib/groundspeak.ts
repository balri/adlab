import { LabSummary } from "../../src/types";

export const BASE_URL = "https://api.groundspeak.com/adventuresmobile/v1";

export function consumerKey(): string {
	const key = process.env.GEOCACHING_CONSUMER_KEY;
	if (!key) {
		throw new Error("GEOCACHING_CONSUMER_KEY is not set");
	}
	return key;
}

async function request(
	path: string,
	accessToken: string,
	init?: RequestInit,
): Promise<unknown> {
	const res = await fetch(`${BASE_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "Adventures/1.56.0 (4936) (android/32)",
			"X-Consumer-Key": consumerKey(),
			Authorization: `Bearer ${accessToken}`,
			...init?.headers,
		},
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(
			`Groundspeak API ${path} failed(${res.status}): ${body}`,
		);
	}

	return res.json();
}

export interface SearchAdventuresRequest {
	Origin: { Latitude: number; Longitude: number };
	RadiusInMeters: number;
	Take: number;
	CompletionStatuses: string[];
	OnlyHighlyRecommended: boolean;
	AdventureTypes: string[];
	MedianCompletionTimes: string[];
	Themes: string[];
	ExcludeOwned: boolean;
}

export interface SearchAdventuresResponse {
	totalCount: number;
	items: Array<LabSummary>;
}

export async function searchAdventures(
	body: SearchAdventuresRequest,
	accessToken: string,
): Promise<SearchAdventuresResponse> {
	return (await request("/public/adventures/search", accessToken, {
		method: "POST",
		body: JSON.stringify(body),
	})) as unknown as SearchAdventuresResponse;
}

export function getAdventure(
	guid: string,
	accessToken: string,
): Promise<unknown> {
	return request(
		`/public/adventures/${encodeURIComponent(guid)}`,
		accessToken,
	);
}
