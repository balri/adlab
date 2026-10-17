import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { LabDetail, LabReview, LabReviewsPage } from "../types";
import { useApi } from "../useApi";
import LabReviews from "./LabReviews";

vi.mock("../useApi", () => ({
	useApi: vi.fn(),
}));

const lab: LabDetail = {
	adventureGuid: "guid-1",
	title: "Riverside Ramble",
	keyImageUrl: "",
	smartLink: "",
	deepLink: "",
	firebaseDynamicLink: "",
	description: "A stroll along the river.",
	ownerPublicGuid: "",
	createdUtc: "",
	publishedUtc: "",
	ratingsAverage: 4.2,
	ratingsTotalCount: 8,
	isHighlyRecommended: false,
	location: { latitude: 0, longitude: 0 },
	stagesTotalCount: 0,
	adventureType: "",
	completionStatus: "NotStarted",
	adventureThemes: [],
	stageSummaries: [],
	journalsTotalCount: 0,
	ownerUsername: "adventurer",
	reviewsTotalCount: 21,
	recommendedCount: 1,
	completionCount: 0,
};

const firstReview: LabReview = {
	id: "review-1",
	reviewText: "A lovely route.",
	rating: 5,
	createdUtc: "2026-10-17T00:00:00Z",
	createdDate: "October 17, 2026",
	playerPublicGuid: "player-1",
	playerAvatarUrl: "",
	playerUsername: "RiverWalker",
	playerGeocacheFindCount: 10,
	playerCompletedAdventureCount: 2,
	recommended: true,
	adventureCompletedDateUtc: "",
	adventureCompletedDate: "",
	images: [
		{
			id: 1270638,
			url: "https://example.com/review-photo.jpg",
		},
	],
	playerTags: [],
	isCreator: false,
};

const secondReview: LabReview = {
	...firstReview,
	id: "review-21",
	reviewText: "Page two review.",
	recommended: false,
	images: [],
};

const firstPage: LabReviewsPage = {
	totalCount: 21,
	items: [firstReview],
};

const secondPage: LabReviewsPage = {
	totalCount: 21,
	items: [secondReview],
};

const mockGetLab = vi.fn();
const mockGetReviews = vi.fn();
const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(
	dialogPrototype,
	"showModal",
);
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, "close");
const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");

function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/labs/guid-1/reviews"]}>
			<Routes>
				<Route path="/labs/:guid/reviews" element={<LabReviews />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("LabReviews", () => {
	beforeEach(() => {
		sessionStorage.clear();
		vi.clearAllMocks();
		vi.mocked(useApi).mockReturnValue({
			getLab: mockGetLab,
			getReviews: mockGetReviews,
			searchLabs: vi.fn(),
			checkAnswer: vi.fn(),
			submitAnswer: vi.fn(),
		});
		mockGetLab.mockResolvedValue(lab);
		mockGetReviews.mockImplementation((_guid, skip) =>
			Promise.resolve(skip === 0 ? firstPage : secondPage),
		);
		Object.defineProperty(dialogPrototype, "showModal", {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.setAttribute("open", "");
			},
		});
		Object.defineProperty(dialogPrototype, "close", {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.removeAttribute("open");
				this.dispatchEvent(new Event("close"));
			},
		});
		Object.defineProperty(window, "scrollY", {
			configurable: true,
			value: 0,
		});
		vi.stubGlobal("scrollTo", vi.fn());
	});

	afterEach(() => {
		if (originalShowModal) {
			Object.defineProperty(
				dialogPrototype,
				"showModal",
				originalShowModal,
			);
		} else {
			Reflect.deleteProperty(dialogPrototype, "showModal");
		}
		if (originalClose) {
			Object.defineProperty(dialogPrototype, "close", originalClose);
		} else {
			Reflect.deleteProperty(dialogPrototype, "close");
		}
		if (originalScrollY) {
			Object.defineProperty(window, "scrollY", originalScrollY);
		}
		vi.unstubAllGlobals();
	});

	it("loads the next review page and highlights recommended ratings", async () => {
		renderPage();

		const rating = await screen.findByLabelText(
			"Recommended rating: 5 out of 5",
		);
		expect(rating).toHaveClass("lab-review-rating-recommended");
		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		await waitFor(() =>
			expect(mockGetReviews).toHaveBeenLastCalledWith(
				"guid-1",
				20,
				20,
				expect.any(AbortSignal),
			),
		);
		expect(await screen.findByText("Page two review.")).toBeInTheDocument();
		expect(screen.queryByText("A lovely route.")).not.toBeInTheDocument();
	});

	it("opens review photos in a modal and restores scroll when closed", async () => {
		renderPage();

		const photoButton = await screen.findByRole("button", {
			name: "View review photo 1 by RiverWalker",
		});
		Object.defineProperty(window, "scrollY", {
			configurable: true,
			value: 480,
		});
		fireEvent.click(photoButton);

		const dialog = screen.getByRole("dialog", { name: "Review photo" });
		await waitFor(() => expect(dialog).toHaveAttribute("open"));
		expect(
			within(dialog).getByRole("img", {
				name: "Review photo 1 by RiverWalker",
			}),
		).toHaveAttribute("src", "https://example.com/review-photo.jpg");

		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		await waitFor(() =>
			expect(window.scrollTo).toHaveBeenCalledWith(0, 480),
		);
		expect(document.activeElement).toBe(photoButton);
	});
});
