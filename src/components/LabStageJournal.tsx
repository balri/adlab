import { LabStage } from "../types";

export default function LabStageJournal(params: { stage: LabStage }) {
	const { stage } = params;
	return (
		<>
			<h2>Journal</h2>
			<div className="lab-detail-content">
				{stage.journalImageUrl && <img src={stage.journalImageUrl} />}
				<div>
					<p style={{ whiteSpace: "pre-line" }}>
						{stage.journalMessage}
					</p>
				</div>
			</div>
		</>
	);
}
