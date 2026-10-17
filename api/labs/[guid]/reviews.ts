import { VercelRequest, VercelResponse } from "@vercel/node";
import { getReviews } from "../../_lib/groundspeak.js";

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

	const guid = req.query.guid;
	if (typeof guid !== "string" || guid.length === 0) {
		res.status(400).json({ error: "guid path param is required" });
		return;
	}
	const skip = req.query.skip === undefined ? 0 : Number(req.query.skip);
	const take = req.query.take === undefined ? 20 : Number(req.query.take);
	if (
		!Number.isInteger(skip) ||
		skip < 0 ||
		!Number.isInteger(take) ||
		take < 1
	) {
		res.status(400).json({ error: "skip and take must be valid integers" });
		return;
	}

	try {
		const reviews = await getReviews(guid, accessToken, skip, take);
		res.status(200).json(reviews);
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
