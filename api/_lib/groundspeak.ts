const BASE_URL = "https://api.groundspeak.com/adventuresmobile/v1";

function consumerKey(): string {
  const key = process.env.GEOCACHING_CONSUMER_KEY;
  if (!key) {
    throw new Error("GEOCACHING_CONSUMER_KEY is not set");
  }
  return key;
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Consumer-Key": consumerKey(),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groundspeak API ${path} failed (${res.status}): ${body}`);
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

/** Raw response shape is not documented upstream — see normalize.ts. */
export function searchAdventures(body: SearchAdventuresRequest): Promise<unknown> {
  return request("/public/adventures/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Raw response shape is not documented upstream — see normalize.ts. */
export function getAdventure(guid: string): Promise<unknown> {
  return request(`/public/adventures/${encodeURIComponent(guid)}`);
}
