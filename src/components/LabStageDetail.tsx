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
				<h1>{stage.title}</h1>
				<div className="lab-detail-content">
					{stage.keyImageUrl && <img src={stage.keyImageUrl} width="500" />}
					<div>
						<p style={{ whiteSpace: "pre-line" }}>{stage.description}</p>
					</div>
				</div>
				<h2>Question</h2>
				<p>{stage.question}</p>
			</StageModal>
		)}
	</>);
}
