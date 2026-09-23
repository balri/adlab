import { describe, expect, it, beforeEach } from "vitest";
import { MD5 } from "crypto-js";
import { calculateAnswer, checkAnswer } from "./checkAnswer";
import type { LabStage } from "../types";

const makeStage = (overrides: Partial<LabStage> = {}): LabStage =>
	({
		challengeType: "SingleChoice",
		question: "",
		description: "",
		findCodeHashBase16v2: "",
		answerCodeHashesBase16v2: [],
		...overrides,
	}) as LabStage;

const hashAnswer = (answer: string, userGuid = "test-guid") =>
	MD5((userGuid + answer.replaceAll(" ", "")).toLowerCase()).toString();

beforeEach(() => {
	localStorage.clear();
	localStorage.setItem("userGuid", "test-guid");
});

describe("checkAnswer", () => {
	it("returns true when the answer matches findCodeHashBase16v2", () => {
		const answer = "42";

		const stage = makeStage({
			findCodeHashBase16v2: hashAnswer(answer),
		});

		expect(checkAnswer(stage, answer)).toBe(true);
	});

	it("returns true when the answer matches answerCodeHashesBase16v2", () => {
		const answer = "42";

		const stage = makeStage({
			answerCodeHashesBase16v2: [hashAnswer(answer)],
		});

		expect(checkAnswer(stage, answer)).toBe(true);
	});

	it("returns false when the answer does not match", () => {
		const stage = makeStage({
			findCodeHashBase16v2: hashAnswer("42"),
		});

		expect(checkAnswer(stage, "43")).toBe(false);
	});

	it("ignores spaces in the answer", () => {
		const stage = makeStage({
			findCodeHashBase16v2: hashAnswer("42"),
		});

		expect(checkAnswer(stage, "4 2")).toBe(true);
	});

	it("matches case-insensitively", () => {
		const stage = makeStage({
			findCodeHashBase16v2: hashAnswer("Hello"),
		});

		expect(checkAnswer(stage, "HELLO")).toBe(true);
	});
});

describe("calculateAnswer", () => {
	it("finds a matching multiple choice answer", () => {
		const stage = makeStage({
			challengeType: "MultiChoice",
			multiChoiceOptions: [
				{
					text: "Red",
					order: 0,
				},
				{
					text: "42",
					order: 0,
				},
				{
					text: "Blue",
					order: 0,
				},
			],
			answerCodeHashesBase16v2: [hashAnswer("42")],
		});

		expect(calculateAnswer(stage)).toBe("42");
	});

	it("returns null when no multiple choice answer matches", () => {
		const stage = makeStage({
			challengeType: "MultiChoice",
			multiChoiceOptions: [
				{
					text: "Red",
					order: 0,
				},
				{
					text: "42",
					order: 0,
				},
			],
		});

		expect(calculateAnswer(stage)).toBeNull();
	});

	it("finds a numeric answer", () => {
		const stage = makeStage({
			question: "How many people are there?",
			answerCodeHashesBase16v2: [hashAnswer("42")],
		});

		expect(calculateAnswer(stage)).toBe("42");
	});

	it("finds a number written in words", () => {
		const stage = makeStage({
			question: "What number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("forty-two")],
		});

		expect(calculateAnswer(stage)).toBe("forty-two");
	});

	it("finds a colour", () => {
		const stage = makeStage({
			question: "What colour is the flag?",
			answerCodeHashesBase16v2: [hashAnswer("green")],
		});

		expect(calculateAnswer(stage)).toBe("green");
	});

	it("finds a letter", () => {
		const stage = makeStage({
			question: "What letter is shown?",
			answerCodeHashesBase16v2: [hashAnswer("q")],
		});

		expect(calculateAnswer(stage)).toBe("q");
	});

	it("finds a month", () => {
		const stage = makeStage({
			question: "Which month was this built?",
			answerCodeHashesBase16v2: [hashAnswer("september")],
		});

		expect(calculateAnswer(stage)).toBe("september");
	});

	it("falls back to phrases from the description", () => {
		const stage = makeStage({
			question: "What is the answer?",
			description: "The hidden answer is somewhere in this text.",
			answerCodeHashesBase16v2: [hashAnswer("hidden answer")],
		});

		expect(calculateAnswer(stage)).toBe("hidden answer");
	});

	it("returns null when nothing matches", () => {
		const stage = makeStage({
			question: "What is the answer?",
			description: "There is nothing useful here.",
		});

		expect(calculateAnswer(stage)).toBeNull();
	});
});

describe("digit questions", () => {
	it("finds a 1-digit number", () => {
		const stage = makeStage({
			question: "What 1 digit number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("7")],
		});

		expect(calculateAnswer(stage)).toBe("7");
	});

	it("finds a 2-digit number", () => {
		const stage = makeStage({
			question: "What 2-digit number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("42")],
		});

		expect(calculateAnswer(stage)).toBe("42");
	});

	it("supports spaces around the hyphen", () => {
		const stage = makeStage({
			question: "What 4 - digit number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("1234")],
		});

		expect(calculateAnswer(stage)).toBe("1234");
	});

	it("supports no hyphen", () => {
		const stage = makeStage({
			question: "What 4 digit number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("1234")],
		});

		expect(calculateAnswer(stage)).toBe("1234");
	});

	it("does not search 7-digit numbers", () => {
		const stage = makeStage({
			question: "What 7-digit number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("1234567")],
		});

		expect(calculateAnswer(stage)).toBeNull();
	});

	it("does not include leading zeroes in multi-digit ranges", () => {
		const stage = makeStage({
			question: "What 2-digit number is shown?",
			answerCodeHashesBase16v2: [hashAnswer("07")],
		});

		expect(calculateAnswer(stage)).toBeNull();
	});

	it("prioritises a digit-range question over the generic number question", () => {
		const stage = makeStage({
			question: "What 3 digit number is the answer?",
			answerCodeHashesBase16v2: [hashAnswer("123")],
		});

		expect(calculateAnswer(stage)).toBe("123");
	});
});

describe("month questions", () => {
	it("finds a numeric month", () => {
		const stage = makeStage({
			question: "What month was this built?",
			answerCodeHashesBase16v2: [hashAnswer("9")],
		});

		expect(calculateAnswer(stage)).toBe("9");
	});

	it("finds a month name", () => {
		const stage = makeStage({
			question: "What month was this built?",
			answerCodeHashesBase16v2: [hashAnswer("september")],
		});

		expect(calculateAnswer(stage)).toBe("september");
	});

	it("prefers a numeric month before a month name", () => {
		const stage = makeStage({
			question: "What month was this built?",
			answerCodeHashesBase16v2: [
				hashAnswer("9"),
				hashAnswer("september"),
			],
		});

		expect(calculateAnswer(stage)).toBe("9");
	});
});
