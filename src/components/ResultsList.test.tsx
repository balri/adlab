import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResultsList from "./ResultsList";
import type { LabSummary } from "../types";

function lab(overrides: Partial<LabSummary> = {}): LabSummary {
	return {
		adventureGuid: "guid-1",
		title: "Test Lab",
		keyImageUrl: "",
		smartLink: "",
		deepLink: "",
		firebaseDynamicLink: "",
		description: "",
		ownerPublicGuid: "",
		createdUtc: "",
		publishedUtc: "",
		ratingsAverage: 4.5,
		ratingsTotalCount: 10,
		isHighlyRecommended: false,
		location: { latitude: -27.20575, longitude: 153.0761166667 },
		stagesTotalCount: 3,
		adventureType: "Nonsequential",
		completionStatus: "NotStarted",
		adventureThemes: [],
		...overrides,
	};
}

function renderResults(labs: LabSummary[]) {
	return render(
		<MemoryRouter>
			<ResultsList
				labs={labs}
				searchCentre={{ latitude: -27.5, longitude: 153.0 }}
			/>
		</MemoryRouter>,
	);
}

describe("ResultsList", () => {
	beforeEach(() => sessionStorage.clear());

	it("renders a link, rating, and stage count for each lab", () => {
		renderResults([lab()]);

		expect(screen.getByRole("link", { name: "Test Lab" })).toHaveAttribute(
			"href",
			"/labs/guid-1",
		);
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName === "SPAN" &&
					element.textContent === "★ 4.5 (10)",
			),
		).not.toHaveClass("lab-review-rating-recommended");
		expect(screen.getByText("3 stages")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Navigate" })).toHaveAttribute(
			"href",
			"https://www.google.com/maps/search/?api=1&query=-27.20575%2C153.0761166667",
		);
		expect(
			screen.queryByRole("link", { name: "Reviews" }),
		).not.toBeInTheDocument();
	});

	it("highlights ratings for highly recommended labs", () => {
		renderResults([lab({ isHighlyRecommended: true })]);

		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName === "SPAN" &&
					element.textContent === "★ 4.5 (10)",
			),
		).toHaveClass("lab-review-rating-recommended");
	});

	it("shows the published date in lab metadata", () => {
		const publishedUtc = "2026-10-17T12:00:00Z";
		renderResults([lab({ publishedUtc })]);

		const expectedDate = new Intl.DateTimeFormat(undefined, {
			month: "long",
			day: "numeric",
			year: "numeric",
		}).format(new Date(publishedUtc));
		const publishedDate = screen.getByText(expectedDate);
		expect(publishedDate.tagName).toBe("TIME");
		expect(publishedDate).toHaveAttribute(
			"datetime",
			"2026-10-17T12:00:00Z",
		);
	});

	it("renders one item per lab", () => {
		renderResults([
			lab({ adventureGuid: "guid-1", title: "Lab One" }),
			lab({ adventureGuid: "guid-2", title: "Lab Two" }),
		]);

		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	it("shows zero distance with two decimal places", () => {
		renderResults([
			lab({ location: { latitude: -27.5, longitude: 153.0 } }),
		]);

		expect(screen.getByText("0.00 km")).toBeInTheDocument();
	});

	it("sorts search results by every available field in both directions", () => {
		const fartherLab = lab({
			adventureGuid: "farther",
			title: "Alpha",
			publishedUtc: "2025-01-01T00:00:00Z",
			ratingsAverage: 3.3,
			ratingsTotalCount: 20,
			numAnswers: 5,
			location: { latitude: -26.5, longitude: 153 },
		});
		const closerLab = lab({
			adventureGuid: "closer",
			title: "Beta",
			publishedUtc: "2024-01-01T00:00:00Z",
			ratingsAverage: 4.7,
			ratingsTotalCount: 5,
			numAnswers: 1,
			location: { latitude: -27.5, longitude: 153 },
		});
		renderResults([fartherLab, closerLab]);

		const sortBy = screen.getByRole("combobox", { name: "Sort by" });
		const direction = screen.getByRole("combobox", {
			name: "Sort direction",
		});
		const resultTitles = () =>
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-item > a",
				),
			).map((link) => link.textContent);
		const expectations = [
			{ field: "name", ascending: ["Alpha", "Beta"] },
			{ field: "date", ascending: ["Beta", "Alpha"] },
			{ field: "rating", ascending: ["Alpha", "Beta"] },
			{ field: "ratingsCount", ascending: ["Beta", "Alpha"] },
			{ field: "answers", ascending: ["Beta", "Alpha"] },
			{ field: "distance", ascending: ["Beta", "Alpha"] },
		];
		expect(sortBy).toHaveValue("distance");
		expect(resultTitles()).toEqual(["Beta", "Alpha"]);
		expect(
			screen.queryByRole("option", { name: "Owner" }),
		).not.toBeInTheDocument();

		for (const { field, ascending } of expectations) {
			fireEvent.change(sortBy, { target: { value: field } });
			fireEvent.change(direction, { target: { value: "asc" } });
			expect(resultTitles()).toEqual(ascending);

			fireEvent.change(direction, { target: { value: "desc" } });
			expect(resultTitles()).toEqual([...ascending].reverse());
		}
	});

	it("restores the selected sort field and direction after remounting", () => {
		const labs = [
			lab({
				adventureGuid: "one",
				title: "Alpha",
				publishedUtc: "2024-01-01T00:00:00Z",
			}),
			lab({
				adventureGuid: "two",
				title: "Beta",
				publishedUtc: "2025-01-01T00:00:00Z",
			}),
		];
		const { unmount } = renderResults(labs);
		fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
			target: { value: "date" },
		});
		fireEvent.change(
			screen.getByRole("combobox", { name: "Sort direction" }),
			{ target: { value: "desc" } },
		);
		unmount();

		renderResults(labs);

		expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue(
			"date",
		);
		expect(
			screen.getByRole("combobox", { name: "Sort direction" }),
		).toHaveValue("desc");
		expect(
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-item > a",
				),
			).map((link) => link.textContent),
		).toEqual(["Beta", "Alpha"]);
	});

	it("sorts results by completion status in both directions", () => {
		const labs = [
			lab({
				adventureGuid: "completed",
				title: "Completed",
				completionStatus: "Completed",
			}),
			lab({
				adventureGuid: "in-progress",
				title: "In Progress",
				completionStatus: "InProgress",
			}),
			lab({
				adventureGuid: "not-started",
				title: "Not Started",
				completionStatus: "NotStarted",
			}),
		];
		renderResults(labs);

		const sortBy = screen.getByRole("combobox", { name: "Sort by" });
		const direction = screen.getByRole("combobox", {
			name: "Sort direction",
		});
		const resultTitles = () =>
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-item > a",
				),
			).map((link) => link.textContent);

		fireEvent.change(sortBy, { target: { value: "status" } });
		expect(resultTitles()).toEqual([
			"Not Started",
			"In Progress",
			"Completed",
		]);
		fireEvent.change(direction, { target: { value: "desc" } });
		expect(resultTitles()).toEqual([
			"Completed",
			"In Progress",
			"Not Started",
		]);
	});
});
