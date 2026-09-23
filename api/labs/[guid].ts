import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdventure } from "../_lib/groundspeak.js";
import {
	deleteAnswer,
	getStoredAnswers,
	upsertAnswer,
} from "../_lib/database.js";
import { calculateAnswer, checkAnswer } from "../_lib/answer.js";

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

	try {
		const lab = await getAdventure(guid, accessToken);
		const userGuid = req.cookies.userGuid;

		const storedAnswers = await getStoredAnswers(guid);

		const answerMap = new Map(
			storedAnswers.map((row) => [row.stage_guid, row.calculated_answer]),
		);

		const stageSummaries = await Promise.all(
			lab.stageSummaries.map(async (stage) => {
				let calculatedAnswer = answerMap.get(stage.id);

				// Answer may have changed since storage
				if (calculatedAnswer !== undefined) {
					const isAnswerCorrect = checkAnswer(
						userGuid,
						stage,
						calculatedAnswer,
					);
					if (!isAnswerCorrect) {
						await deleteAnswer(guid, stage.id);
						calculatedAnswer = undefined;
					}
				}

				if (calculatedAnswer === undefined) {
					calculatedAnswer = calculateAnswer(userGuid, stage);

					if (calculatedAnswer !== null) {
						await upsertAnswer(guid, stage.id, calculatedAnswer);
					}
				}

				return {
					...stage,
					correctAnswer: calculatedAnswer ?? null,
				};
			}),
		);
		const stagesTotalCount = stageSummaries.length;

		res.status(200).json({
			...lab,
			stageSummaries,
			stagesTotalCount,
		});
	} catch (err) {
		res.status(502).json({ error: (err as Error).message });
	}
}
