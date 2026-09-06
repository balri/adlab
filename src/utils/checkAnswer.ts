import { MD5 } from "crypto-js";
import { LabStage } from "../types";

const POSSIBLE_NUMBER_QUESTIONS = [
	"how much",
	"how many",
	'what date", "what month',
	"what year",
	"which date",
	"which month",
	"which year",
	"how old",
	"when",
	"number",
	"numeral",
];

export const checkAnswer = (stage: LabStage, answer: string): boolean => {
	const userGuid = sessionStorage.getItem("userGuid") || "";
	const answerNoSpace = answer.replaceAll(" ", "");
	const hashInput = (userGuid + answerNoSpace).toLowerCase();
	const hashResult = MD5(hashInput).toString();

	return (
		hashResult === stage.findCodeHashBase16v2 ||
		stage.answerCodeHashesBase16v2.includes(hashResult)
	);
};

export const calculateAnswer = (stage: LabStage): string | null => {
	if (stage.challengeType === "MultiChoice") {
		return (
			stage.multiChoiceOptions?.find((option) =>
				checkAnswer(stage, option.text),
			)?.text ?? ""
		);
	}

	const question = stage.question.toLowerCase();

	if (POSSIBLE_NUMBER_QUESTIONS.some((str) => question.includes(str))) {
		for (let i = 0; i < 3000; i++) {
			if (checkAnswer(stage, String(i))) {
				return String(i);
			}
		}
	}

	return null;
};
