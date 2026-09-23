import { VercelRequest, VercelResponse } from "@vercel/node";
import { checkAnswer } from "../_lib/answer";
import { upsertAnswer } from "../_lib/database";

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

	const { adventureGuid, stage, answer } = req.body;
	const userGuid = req.cookies.userGuid;

	try {
		const isAnswerCorrect = checkAnswer(userGuid, stage, answer);

		if (isAnswerCorrect) {
			await upsertAnswer(adventureGuid, stage.id, answer);
			res.status(200).json({
				success: true,
				message: `"${answer}" is the correct answer`,
			});
			return;
		}

		res.status(200).json({
			success: false,
			error: `"${answer}" is not the correct answer`,
		});
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
