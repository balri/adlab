import { VercelRequest, VercelResponse } from "@vercel/node";
import { getUser } from "./_lib/groundspeak";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "GET") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const accessToken = authHeader.substring(7);

	try {
		const user = await getUser(accessToken);
		res.status(200).json(user);
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
