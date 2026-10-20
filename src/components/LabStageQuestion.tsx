import { useState } from "react";
import { LabDetail, LabStage } from "../types";
import SubmitAnswer from "./SubmitAnswer";

interface LabStageQuestionParams {
	loading: boolean;
	lab: LabDetail;
	stage: LabStage;
	onCheck: (answer: string) => void;
	onSuccess: (lab: LabDetail) => void;
	onError: (err: string) => void;
}

interface FormState {
	answer: string;
}

const DEFAULT_FORM: FormState = { answer: "" };

export default function LabStageQuestion(params: LabStageQuestionParams) {
	const [form, setForm] = useState<FormState>(DEFAULT_FORM);
	const { loading, stage, onCheck, lab, onSuccess, onError } = params;

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

		onCheck(form.answer);
	}

	return (
		<>
			<h2>Question</h2>
			<p>{stage.question}</p>

			{stage.correctAnswer ? (
				<div className="search-form-row">
					<span className="success-text">{stage.correctAnswer}</span>
					<SubmitAnswer
						lab={lab}
						stage={stage}
						onSuccess={onSuccess}
						onError={onError}
					/>
				</div>
			) : (
				<form className="search-form" onSubmit={handleSubmit}>
					<div className="search-form-row">
						{stage.challengeType === "SingleChoice" && (
							<input
								type="text"
								value={form.answer}
								onChange={(e) =>
									updateForm("answer", e.target.value)
								}
							/>
						)}

						{stage.challengeType === "MultiChoice" && (
							<select
								value={form.answer}
								onChange={(e) =>
									updateForm("answer", e.target.value)
								}
							>
								<option value=""></option>

								{stage.multiChoiceOptions?.map((option) => (
									<option
										key={option.text}
										value={option.text}
									>
										{option.text}
									</option>
								))}
							</select>
						)}

						<input type="submit" value="Check" disabled={loading} />
					</div>
				</form>
			)}
		</>
	);
}
