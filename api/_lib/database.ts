import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not configured");
}

export const sql = neon(process.env.DATABASE_URL);

export const getStoredAnswers = async (guid: string) => {
	return await sql`
			SELECT stage_guid, calculated_answer
			FROM stage_answers
			WHERE lab_guid = ${guid}
		`;
};

export const upsertAnswer = async (
	guid: string,
	stageId: string,
	answer: string,
) => {
	return await sql`
		INSERT INTO stage_answers (
			lab_guid,
			stage_guid,
			calculated_answer
		)
		VALUES (
			${guid},
			${stageId},
			${answer}
		)
		ON CONFLICT (lab_guid, stage_guid)
		DO UPDATE SET
			calculated_answer = EXCLUDED.calculated_answer,
			updated_at = NOW()
	`;
};

export const deleteAnswer = async (guid: string, stageId: string) => {
	return await sql`
		DELETE
		FROM stage_answers
		WHERE lab_guid = ${guid}
		AND stage_guid = ${stageId}
	`;
};
