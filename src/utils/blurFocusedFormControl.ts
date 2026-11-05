export function blurFocusedFormControl(form: HTMLFormElement) {
	const activeElement = form.ownerDocument.activeElement;
	if (activeElement instanceof HTMLElement && form.contains(activeElement)) {
		activeElement.blur();
	}
}
