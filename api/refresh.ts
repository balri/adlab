import { VercelRequest, VercelResponse } from "@vercel/node";
import {
	adventuresUserAgent,
	consumerKey,
	getAdventuresPlatform,
	LABS_API_BASE_URL,
} from "./_lib/groundspeak.js";
import { ApiRefreshResponse } from "../src/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const currentRefreshToken = req.cookies?.["__Secure-refreshToken"];
	const platform = getAdventuresPlatform(req.headers);

	if (!currentRefreshToken) {
		return res.status(401).json({ error: "No refresh token" });
	}

	const response = await fetch(
		`${LABS_API_BASE_URL}/Accounts/RefreshAccessToken?consumerKey=${consumerKey(platform)}`,
		{
			method: "POST",
			headers: {
				"User-Agent": adventuresUserAgent(platform),
				"Content-Type": "application/json",
				"X-Consumer-Key": consumerKey(platform),
			},
			body: JSON.stringify({
				RefreshToken: currentRefreshToken,
			}),
		},
	);

	if (!response.ok) {
		return res.status(401).json({ error: "Failed to refresh token" });
	}

	const data = (await response.json()) as unknown as ApiRefreshResponse;
	const {
		access_token: accessToken,
		refresh_token: refreshToken,
		expires_in: expiresIn,
	} = data;

	res.setHeader(
		"Set-Cookie",
		`__Secure-refreshToken=${encodeURIComponent(refreshToken)}; HttpOnly; Secure; SameSite=Strict; Path=/api/refresh; Max-Age=259200`,
	);

	return res.status(200).json({
		accessToken,
		expiresIn,
	});
}
