export function StageModal({
	open,
	onClose,
	children,
}: {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
}) {
	if (!open) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal"
				onClick={(e) => e.stopPropagation()}
			>
				<button className="modal-close" onClick={onClose} aria-label="Close">
					&times;
				</button>
				{children}
			</div>
		</div>
	);
}
