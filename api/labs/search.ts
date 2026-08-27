import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchAdventures } from "../_lib/groundspeak";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "GET") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const accessToken = authHeader.substring(7);

	const lat = Number(req.query.lat);
	const lng = Number(req.query.lng);
	const radius = Number(req.query.radius ?? 10000);
	const take = Number(req.query.take ?? 25);

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
				CompletionStatuses: ["NotStarted", "InProgress"],
				OnlyHighlyRecommended: false,
				AdventureTypes: [],
				MedianCompletionTimes: [],
				Themes: [],
				ExcludeOwned: true,
			},
			accessToken,
		);

		res.status(200).json(list.items);
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
