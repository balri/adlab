import { useCallback, useMemo, useState } from "react";
import { LabStage } from "../types";
import MD5 from "crypto-js/md5";

interface FormState {
	answer: string;
}

const DEFAULT_FORM: FormState = { answer: "" };

export default function LabStageQuestion(params: { stage: LabStage }) {
	const [form, setForm] = useState<FormState>(DEFAULT_FORM);
	const [submittedAnswer, setSubmittedAnswer] = useState("");
	const [incorrectAnswer, setIncorrectAnswer] = useState<string>("");
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

	const calculatedAnswer = useMemo(() => {
		if (stage.challengeType === "MultiChoice") {
			return (
				stage.multiChoiceOptions?.find((option) =>
					checkAnswer(option.text),
				)?.text ?? ""
			);
		}

		const question = stage.question.toLowerCase();

		if (
			question.includes("how many") ||
			question.includes("how much") ||
			question.includes("number")
		) {
			for (let i = 0; i < 1000; i++) {
				if (checkAnswer(String(i))) {
					return String(i);
				}
			}
		}

		return "";
	}, [stage, checkAnswer]);

	const correctAnswer = calculatedAnswer || submittedAnswer;

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

		if (checkAnswer(form.answer)) {
			setSubmittedAnswer(form.answer);
		} else {
			setIncorrectAnswer(form.answer);
		}
	}

	return (
		<>
			<h2>Question</h2>
			<p>{stage.question}</p>

			{correctAnswer && (
				<p className="success-text">
					{correctAnswer} is the correct answer
				</p>
			)}

			{incorrectAnswer && (
				<p className="error-text">
					{incorrectAnswer} is not the correct answer
				</p>
			)}
			<form className="search-form" onSubmit={handleSubmit}>
				<div className="search-form-row">
					{stage.challengeType === "SingleChoice" && (
						<input
							type="text"
							value={form.answer || correctAnswer}
							onChange={(e) =>
								updateForm("answer", e.target.value)
							}
							disabled={!!correctAnswer}
						/>
					)}

					{stage.challengeType === "MultiChoice" && (
						<select
							value={form.answer || correctAnswer}
							onChange={(e) =>
								updateForm("answer", e.target.value)
							}
							disabled={!!correctAnswer}
						>
							<option value=""></option>

							{stage.multiChoiceOptions?.map((option) => (
								<option key={option.text} value={option.text}>
									{option.text}
								</option>
							))}
						</select>
					)}

					<input
						type="submit"
						value="Check"
						disabled={!!correctAnswer}
					/>
				</div>
			</form>
		</>
	);
}
