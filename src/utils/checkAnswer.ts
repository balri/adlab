import { MD5 } from "crypto-js";
import { LabStage } from "../types";
import { numberToWords } from "./numbersToWords";

const POSSIBLE_NUMBER_QUESTIONS = [
	"how much",
	"how many",
	"date",
	"month",
	"year",
	"how old",
	"when",
	"number",
	"numeral",
	"digit",
];

const POSSIBLE_COLOURS = [
	"red",
	"green",
	"blue",
	"yellow",
	"black",
	"white",
	"pink",
	"purple",
	"orange",
];

const MONTHS = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december",
];

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

const QUESTION_TYPES = [
	{
		matches: (question: string) => /\b\d+\s*-?\s*digit\b/.test(question),
		candidates: (question: string) => {
			const match = question.match(/\b(\d+)\s*-?\s*digit\b/);

			if (!match) {
				return [];
			}

			const digits = Number(match[1]);

			if (digits > 6) {
				return [];
			}

			return digitRange(digits);
		},
	},
	{
		matches: (question: string) =>
			POSSIBLE_NUMBER_QUESTIONS.some((text) => question.includes(text)),
		candidates: () => numbers(),
	},
	{
		matches: (question: string) => question.includes("colour"),
		candidates: () => POSSIBLE_COLOURS,
	},
	{
		matches: (question: string) => question.includes("letter"),
		candidates: () => LETTERS,
	},
	{
		matches: (question: string) => question.includes("month"),
		candidates: () => MONTHS,
	},
];

export const checkAnswer = (stage: LabStage, answer: string): boolean => {
	const userGuid = localStorage.getItem("userGuid") || "";
	const answerNoSpace = answer.replaceAll(" ", "");
	const hashInput = (userGuid + answerNoSpace).toLowerCase();
	const hashResult = MD5(hashInput).toString();

	return (
		hashResult === stage.findCodeHashBase16v2 ||
		stage.answerCodeHashesBase16v2.includes(hashResult)
	);
};

const findMatchingAnswer = (
	stage: LabStage,
	candidates: Iterable<string>,
): string | null => {
	for (const candidate of candidates) {
		if (checkAnswer(stage, candidate)) {
			return candidate;
		}
	}

	return null;
};

const findMatchingPhrases = (stage: LabStage, maxWords = 3): string | null => {
	const words = stage.description.match(/\b[\w'-]+\b/g) ?? [];

	for (let wordCount = 1; wordCount <= maxWords; wordCount++) {
		for (let i = 0; i <= words.length - wordCount; i++) {
			const candidate = words.slice(i, i + wordCount).join(" ");

			if (checkAnswer(stage, candidate)) {
				return candidate;
			}
		}
	}

	return null;
};

const numbers = function* () {
	for (let i = 0; i <= 3000; i++) {
		yield String(i);

		if (i <= 100) {
			const inWords = numberToWords(i);

			yield inWords;
			yield inWords.replaceAll("-", "");
		}
	}
};

const digitRange = (digits: number): Iterable<string> => {
	const min = digits === 1 ? 0 : 10 ** (digits - 1);
	const max = 10 ** digits - 1;

	return (function* () {
		for (let i = min; i <= max; i++) {
			yield String(i);
		}
	})();
};

export const calculateAnswer = (stage: LabStage): string | null => {
	if (stage.challengeType === "MultiChoice") {
		return findMatchingAnswer(
			stage,
			stage.multiChoiceOptions?.map((option) => option.text) ?? [],
		);
	}

	const question = stage.question.toLowerCase();

	for (const type of QUESTION_TYPES) {
		if (type.matches(question)) {
			const answer = findMatchingAnswer(stage, type.candidates(question));

			if (answer) {
				return answer;
			}
		}
	}

	// Finally, try words in the description.
	return findMatchingPhrases(stage, 3);
};
