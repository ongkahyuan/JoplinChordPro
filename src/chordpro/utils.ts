export function toString(value: string | string[] | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (Array.isArray(value)) return value.join(', ');
	return value;
}

export function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}