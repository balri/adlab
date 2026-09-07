import { VercelRequest, VercelResponse } from "@vercel/node";
import { API_BASE_URL, consumerKey } from "./_lib/groundspeak.js";
import { ApiLoginResponse } from "../src/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const { username, password } = req.body;

	const response = await fetch(`${API_BASE_URL}/accounts/login`, {
		method: "POST",
		headers: {
			"User-Agent": "Adventures/1.56.0 (4936) (android/32)",
			"Content-Type": "application/json",
			"X-Consumer-Key": consumerKey(),
		},
		body: JSON.stringify({
			Username: username,
			Password: password,
		}),
	});

	if (!response.ok) {
		return res.status(401).json({ error: "Invalid username or password" });
	}

	const data = (await response.json()) as unknown as ApiLoginResponse;
	const { accessToken, refreshToken, expiresIn } = data;

	res.setHeader(
		"Set-Cookie",
		`__Secure-refreshToken=${encodeURIComponent(refreshToken)}; HttpOnly; Secure; SameSite=Strict; Path=/api/refresh; Max-Age=259200`,
	);

	return res.status(200).json({
		accessToken,
		expiresIn,
	});
}
