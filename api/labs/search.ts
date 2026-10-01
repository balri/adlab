import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchAdventures } from "../_lib/groundspeak.js";
import { LabSummary } from "../../src/types.js";

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

	const lat = Number(req.query.lat);
	const lng = Number(req.query.lng);
	const radius = Number(req.query.radius ?? 10000);
	const take = Number(req.query.take ?? 25);
	const statuses = req.query.statuses
		? Array.isArray(req.query.statuses)
			? req.query.statuses
			: [req.query.statuses]
		: [];
	const excludeOwned = req.query.excludeOwned === "true";
	const userGuid = req.cookies.userGuid;

	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		res.status(400).json({
			error: "lat and lng query params are required",
		});
		return;
	}

	try {
		const list = await searchAdventures(
			{
				Origin: { Latitude: lat, Longitude: lng },
				RadiusInMeters: radius,
				Take: take,
				CompletionStatuses: statuses,
				OnlyHighlyRecommended: false,
				AdventureTypes: [],
				MedianCompletionTimes: [],
				Themes: [],
				ExcludeOwned: excludeOwned,
			},
			accessToken,
		);

		const items = list.items.map((lab: LabSummary) => ({
			...lab,
			ownedByUser: lab.ownerPublicGuid === userGuid,
		}));

		res.setHeader("Cache-Control", "no-store");
		res.status(200).json(items);
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
