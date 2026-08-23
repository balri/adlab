import { fireEvent, render, screen } from "@testing-library/react";
import { StageModal } from "./StageModal";

describe("StageModal", () => {
	it("renders nothing when closed", () => {
		render(
			<StageModal open={false} onClose={() => {}}>
				<p>Stage content</p>
			</StageModal>,
		);
		expect(screen.queryByText("Stage content")).not.toBeInTheDocument();
	});

	it("renders its children when open", () => {
		render(
			<StageModal open onClose={() => {}}>
				<p>Stage content</p>
			</StageModal>,
		);
		expect(screen.getByText("Stage content")).toBeInTheDocument();
	});

	it("calls onClose when the close button is clicked", () => {
		const onClose = vi.fn();
		render(
			<StageModal open onClose={onClose}>
				<p>Stage content</p>
			</StageModal>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when the overlay is clicked but not when the modal body is clicked", () => {
		const onClose = vi.fn();
		render(
			<StageModal open onClose={onClose}>
				<p>Stage content</p>
			</StageModal>,
		);

		fireEvent.click(screen.getByText("Stage content"));
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.click(
			screen.getByText("Stage content").parentElement!.parentElement!,
		);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
