import { useCallback, useState } from "react";
import { LabStage } from "../types";
import MD5 from "crypto-js/md5";

interface FormState {
	answer: string;
}

const DEFAULT_FORM: FormState = { answer: "" };

export default function LabStageQuestion(params: { stage: LabStage }) {
	const [form, setForm] = useState<FormState>(DEFAULT_FORM);
	const [submittedAnswer, setSubmittedAnswer] = useState<string>("");
	const { stage } = params;

	const checkAnswer = useCallback(
		(answer: string): boolean => {
			const userGuid = sessionStorage.getItem("userGuid") || "";
			const answerNoSpace = answer.replaceAll(" ", "");
			const hashInput = (userGuid + answerNoSpace).toLowerCase();
			const hashResult = MD5(hashInput).toString();

			return (
				hashResult === stage.findCodeHashBase16v2 ||
				stage.answerCodeHashesBase16v2.includes(hashResult)
			);
		},
		[stage],
	);

	// For MultiChoice, determine the correct answer from the options.
	const correctAnswer =
		stage.challengeType === "MultiChoice"
			? (stage.multiChoiceOptions?.find((option) =>
					checkAnswer(option.text),
				)?.text ?? "")
			: submittedAnswer;

	function updateForm<K extends keyof FormState>(
		field: K,
		value: FormState[K],
	) {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const answer = form.answer;

		if (checkAnswer(answer)) {
			setSubmittedAnswer(answer);
		} else {
			alert("Your answer is not correct");
		}
	}

	return (
		<>
			<h2>Question</h2>
			<p>{stage.question}</p>

			{correctAnswer && (
				<span>The correct answer is: {correctAnswer}</span>
			)}

			<form onSubmit={handleSubmit}>
				{stage.challengeType === "SingleChoice" && (
					<input
						type="text"
						value={form.answer}
						onChange={(e) => updateForm("answer", e.target.value)}
					/>
				)}

				{stage.challengeType === "MultiChoice" && (
					<select
						value={form.answer}
						onChange={(e) => updateForm("answer", e.target.value)}
					>
						<option value=""></option>

						{stage.multiChoiceOptions?.map((option) => (
							<option key={option.text} value={option.text}>
								{option.text}
							</option>
						))}
					</select>
				)}

				<input type="submit" value="Submit" />
			</form>
		</>
	);
}
