import { LabSummary } from "../../src/types";

const BASE_URL = "https://api.groundspeak.com/adventuresmobile/v1";

function consumerKey(): string {
  const key = process.env.GEOCACHING_CONSUMER_KEY;
  if (!key) {
    throw new Error("GEOCACHING_CONSUMER_KEY is not set");
  }
  return key;
}

function username(): string {
  const username = process.env.GEOCACHING_USERNAME;
  if (!username) {
    throw new Error("GEOCACHING_USERNAME is not set");
  }
  return username;
}

function password(): string {
  const password = process.env.GEOCACHING_PASSWORD;
  if (!password) {
    throw new Error("GEOCACHING_PASSWORD is not set");
  }
  return password;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function login(): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/public/accounts/login`, {
    method: "POST",
    headers: {
      "User-Agent": "Adventures/1.56.0 (4936) (android/32)",
      "Content-Type": "application/json",
      "X-Consumer-Key": consumerKey(),
    },
    body: JSON.stringify({
      Username: username(),
      Password: password()
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groundspeak API login failed(${res.status}): ${body}`);
  }

  return res.json() as unknown as LoginResponse;
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const loginResp = await login();
  const accessToken = loginResp.accessToken;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Adventures/1.56.0 (4936) (android/32)",
      "X-Consumer-Key": consumerKey(),
      "Authorization": `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groundspeak API ${path} failed(${res.status}): ${body}`);
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

export async function searchAdventures(body: SearchAdventuresRequest): Promise<SearchAdventuresResponse> {
  return await request("/public/adventures/search", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as SearchAdventuresResponse;
}

export function getAdventure(guid: string): Promise<unknown> {
  return request(`/public/adventures/${encodeURIComponent(guid)}`);
}
