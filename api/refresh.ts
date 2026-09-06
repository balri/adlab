import { VercelRequest, VercelResponse } from "@vercel/node";
import { consumerKey, LABS_API_BASE_URL } from "./_lib/groundspeak.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const { refreshToken } = req.body;
	// const consumerKey = consumerKey();
	const response = await fetch(
		`${LABS_API_BASE_URL}/Accounts/RefreshAccessToken?consumerKey=${consumerKey()}`,
		{
			method: "POST",
			headers: {
				"User-Agent": "Adventures/1.56.0 (4936) (android/32)",
				"Content-Type": "application/json",
				"X-Consumer-Key": consumerKey(),
			},
			body: JSON.stringify({
				RefreshToken: refreshToken,
			}),
		},
	);

	if (!response.ok) {
		return res.status(401).json({ error: "Failed to refresh token" });
	}

	const data = await response.json();

	return res.status(200).json(data);
}
