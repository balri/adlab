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
}

export default function SortControls<Value extends string>({
	options,
	value,
	onValueChange,
	direction,
	onDirectionChange,
}: Props<Value>) {
	return (
		<div className="list-sort-controls">
			<label>
				Sort by
				<select
					aria-label="Sort by"
					value={value}
					onChange={(event) =>
						onValueChange(event.currentTarget.value as Value)
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
	);
}
