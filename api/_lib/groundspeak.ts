import {
	LabDetail,
	LabReviewsPage,
	LabSummary,
	User,
} from "../../src/types.js";

export const API_BASE_URL = "https://api.groundspeak.com/adventuresmobile/v1";
export const LABS_API_BASE_URL = "https://labs-api.geocaching.com/Api";

export type AdventuresPlatform = "android" | "apple";

export const APPLE_USER_AGENT = "Adventures/1.56.0 (4936) (ios/17.0)";
export const ANDROID_USER_AGENT = "Adventures/1.56.0 (4936) (android/32)";
export const APPLE_CONSUMER_KEY = "1301D998-6435-4804-8CA8-9A5DE607269A";
export const ANDROID_CONSUMER_KEY = "A01A9CA1-29E0-46BD-A270-9D894A527B91";

export function consumerKey(platform: AdventuresPlatform = "android"): string {
	return platform === "apple" ? APPLE_CONSUMER_KEY : ANDROID_CONSUMER_KEY;
}

export function adventuresUserAgent(
	platform: AdventuresPlatform = "android",
): string {
	return platform === "apple" ? APPLE_USER_AGENT : ANDROID_USER_AGENT;
}

export function getAdventuresPlatform(
	headers:
		| {
				"x-adventures-platform"?: string | string[] | undefined;
				"user-agent"?: string | string[] | undefined;
		  }
		| undefined,
): AdventuresPlatform {
	const platformHeader = headers?.["x-adventures-platform"];
	const platform = Array.isArray(platformHeader)
		? platformHeader[0]
		: platformHeader;
	if (platform?.toLowerCase() === "apple") {
		return "apple";
	}

	const userAgentHeader = headers?.["user-agent"];
	const userAgent = Array.isArray(userAgentHeader)
		? userAgentHeader[0]
		: userAgentHeader;
	return /iPhone|iPad|iPod|Macintosh|Mac OS X|MacIntel|MacPPC/i.test(
		userAgent || "",
	)
		? "apple"
		: "android";
}

async function request(
	path: string,
	accessToken: string,
	init?: RequestInit,
	platform: AdventuresPlatform = "android",
): Promise<unknown> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		...init,
		headers: {
			Accept: "application/json",
			"User-Agent": adventuresUserAgent(platform),
			"X-Consumer-Key": consumerKey(platform),
			Authorization: `Bearer ${accessToken}`,
			...(init?.body !== undefined
				? { "Content-Type": "application/json" }
				: {}),
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

async function requestLabsApi(
	path: string,
	accessToken: string,
	init?: RequestInit,
	platform: AdventuresPlatform = "android",
): Promise<unknown> {
	const res = await fetch(`${LABS_API_BASE_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			"User-Agent": adventuresUserAgent(platform),
			"X-Consumer-Key": consumerKey(platform),
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

interface SearchAdventuresRequest {
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

interface SearchAdventuresResponse {
	totalCount: number;
	items: Array<LabSummary>;
}

interface AnswerRequest {
	AdventureGuid: string;
	StageGuid: string;
	Answer: string;
	ChallengeType: string;
}

interface AnswerResponse {
	result: string;
	journalMessage: string;
	adventureComplete: boolean;
	completedAdventureProperties: unknown;
}

export async function searchAdventures(
	body: SearchAdventuresRequest,
	accessToken: string,
	platform: AdventuresPlatform = "android",
): Promise<SearchAdventuresResponse> {
	return (await request(
		"/public/adventures/search",
		accessToken,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
		platform,
	)) as unknown as SearchAdventuresResponse;
}

export async function getAdventure(
	guid: string,
	accessToken: string,
	platform: AdventuresPlatform = "android",
): Promise<LabDetail> {
	return (await request(
		`/public/adventures/${encodeURIComponent(guid)}`,
		accessToken,
		undefined,
		platform,
	)) as unknown as LabDetail;
}

export async function getUser(
	accessToken: string,
	platform: AdventuresPlatform = "android",
): Promise<User> {
	return (await requestLabsApi(
		`/Accounts/GetAccount`,
		accessToken,
		undefined,
		platform,
	)) as User;
}

export async function submitAnswer(
	body: AnswerRequest,
	accessToken: string,
	platform: AdventuresPlatform = "android",
) {
	return (await request(
		`/submitAnswer`,
		accessToken,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
		platform,
	)) as unknown as AnswerResponse;
}

export async function getReviews(
	guid: string,
	accessToken: string,
	skip = 0,
	take = 20,
	platform: AdventuresPlatform = "android",
): Promise<LabReviewsPage> {
	const query = new URLSearchParams({
		skip: String(skip),
		take: String(take),
	});
	const response = await request(
		`/public/adventures/${encodeURIComponent(guid)}/reviews/search?${query}`,
		accessToken,
		{
			method: "POST",
		},
		platform,
	);

	if (Array.isArray(response)) {
		return {
			totalCount: response.length,
			items: response,
		} as LabReviewsPage;
	}

	if (
		response &&
		typeof response === "object" &&
		"items" in response &&
		Array.isArray(response.items)
	) {
		const pagedResponse = response as {
			totalCount?: unknown;
			items: Array<LabReviewsPage["items"][number]>;
		};
		return {
			totalCount:
				typeof pagedResponse.totalCount === "number"
					? pagedResponse.totalCount
					: pagedResponse.items.length,
			items: pagedResponse.items,
		} as LabReviewsPage;
	}

	throw new Error(
		"Unexpected Groundspeak reviews response: expected an array or an object with an items array",
	);
}
