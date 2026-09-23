import { useState } from "react";
import { LabStage } from "../types";
import { checkAnswer } from "../utils/checkAnswer";

interface LabStageQuestionParams {
	loading: boolean;
	stage: LabStage;
	onUpdateStage: (answer: string) => void;
	canAnswer: boolean;
	onSubmit: (answer: string) => void;
}

interface FormState {
	answer: string;
}

const DEFAULT_FORM: FormState = { answer: "" };

export default function LabStageQuestion(params: LabStageQuestionParams) {
	const [form, setForm] = useState<FormState>(DEFAULT_FORM);
	const [incorrectAnswer, setIncorrectAnswer] = useState<string>("");
	const { loading, stage, onUpdateStage, canAnswer, onSubmit } = params;

	function updateForm<K extends keyof FormState>(
		field: K,
		value: FormState[K],
	) {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	}

	// TODO: submit POST to backend to check answer
	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (checkAnswer(stage, form.answer)) {
			onUpdateStage(form.answer);
			setIncorrectAnswer("");
		} else {
			setIncorrectAnswer(form.answer);
		}
	}

	async function handleSendAnswer(e: React.FormEvent) {
		e.preventDefault();

		if (!canAnswer || !stage.correctAnswer) {
			return;
		}

		onSubmit(stage.correctAnswer);
	}

	return (
		<>
			<h2>Question</h2>
			<p>{stage.question}</p>

			{stage.correctAnswer && (
				<p className="success-text">
					"{stage.correctAnswer}" is the correct answer
				</p>
			)}
			{incorrectAnswer && (
				<p className="error-text">
					"{incorrectAnswer}" is not the correct answer
				</p>
			)}
			<form className="search-form" onSubmit={handleSubmit}>
				<div className="search-form-row">
					{stage.challengeType === "SingleChoice" && (
						<input
							type="text"
							value={form.answer || stage.correctAnswer}
							onChange={(e) =>
								updateForm("answer", e.target.value)
							}
							disabled={!!stage.correctAnswer}
						/>
					)}

					{stage.challengeType === "MultiChoice" && (
						<select
							value={form.answer || stage.correctAnswer}
							onChange={(e) =>
								updateForm("answer", e.target.value)
							}
							disabled={!!stage.correctAnswer}
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
						disabled={!!stage.correctAnswer}
					/>
					{stage.correctAnswer && !stage.isComplete && canAnswer && (
						<button
							type="button"
							onClick={handleSendAnswer}
							disabled={loading}
						>
							{loading ? "Sending…" : "Send Answer"}
						</button>
					)}
				</div>
			</form>
		</>
	);
}
