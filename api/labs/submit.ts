import { VercelRequest, VercelResponse } from "@vercel/node";
import { submitAnswer } from "../_lib/groundspeak";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method != "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const accessToken = authHeader.substring(7);

	const { adventureGuid, stageGuid, answer, challengeType, userGuid } =
		req.body;

	if (userGuid !== process.env.GEOCACHING_USER_GUID) {
		res.status(403).json({ error: "Forbidden" });
		return;
	}

	try {
		const resp = await submitAnswer(
			{
				AdventureGuid: adventureGuid,
				StageGuid: stageGuid,
				Answer: answer,
				ChallengeType: challengeType,
			},
			accessToken,
		);

		res.setHeader("Cache-Control", "no-store");
		res.status(200).json(resp);
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
