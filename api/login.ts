import { VercelRequest, VercelResponse } from "@vercel/node";
import { API_BASE_URL, consumerKey } from "./_lib/groundspeak";

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

	const data = await response.json();

	return res.status(200).json(data);
}
