import { useState } from "react";
import { LabStage } from "../types";
import { StageModal } from "./StageModal";

export function LabStageDetail({ stage }: { stage: LabStage }) {
	const [showModal, setShowModal] = useState(false);

	return (<>
		<p>
			<button className="btn" onClick={() => setShowModal(true)}>
				{stage.title}
			</button>
		</p>
		{showModal && (
			<StageModal open={showModal} onClose={() => setShowModal(false)}>
				<strong>{stage.title}</strong>
				<p style={{ whiteSpace: "pre-line" }}>{stage.description}</p>
				<strong>Question</strong>
				<p>{stage.question}</p>
			</StageModal>
		)}
	</>);
}
