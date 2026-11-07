import { useState } from "react";

export interface SortOption<Value extends string> {
	value: Value;
	label: string;
}

interface Props<Value extends string> {
	options: SortOption<Value>[];
	value: Value;
	onValueChange: (value: Value) => void;
	direction: "asc" | "desc";
	onDirectionChange: (direction: "asc" | "desc") => void;
	expanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
	showToggle?: boolean;
}

interface SortOptionsToggleProps {
	expanded: boolean;
	onToggle: () => void;
}

export function SortOptionsToggle({
	expanded,
	onToggle,
}: SortOptionsToggleProps) {
	return (
		<button
			type="button"
			className="search-options-toggle"
			aria-expanded={expanded}
			onClick={onToggle}
		>
			Sort options {expanded ? "▲" : "▼"}
		</button>
	);
}

export default function SortControls<Value extends string>({
	options,
	value,
	onValueChange,
	direction,
	onDirectionChange,
	expanded,
	onExpandedChange,
	showToggle = true,
}: Props<Value>) {
	const [internalExpanded, setInternalExpanded] = useState(false);
	const isExpanded = expanded ?? internalExpanded;
	const toggleExpanded = () => {
		const nextExpanded = !isExpanded;
		if (expanded === undefined) setInternalExpanded(nextExpanded);
		onExpandedChange?.(nextExpanded);
	};

	return (
		<>
			{showToggle && (
				<SortOptionsToggle
					expanded={isExpanded}
					onToggle={toggleExpanded}
				/>
			)}
			{isExpanded && (
				<div className="list-sort-controls">
					<label>
						Sort by
						<select
							aria-label="Sort by"
							value={value}
							onChange={(event) =>
								onValueChange(
									event.currentTarget.value as Value,
								)
							}
						>
							{options.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label>
						Direction
						<select
							aria-label="Sort direction"
							value={direction}
							onChange={(event) =>
								onDirectionChange(
									event.currentTarget.value as "asc" | "desc",
								)
							}
						>
							<option value="asc">Ascending</option>
							<option value="desc">Descending</option>
						</select>
					</label>
				</div>
			)}
		</>
	);
}
