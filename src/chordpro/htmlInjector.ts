function findInsertionIndex(html: string): number {
	let idx = html.indexOf('</h2>');
	if (idx !== -1) return idx + 5; // after subtitle

	idx = html.indexOf('</h1>');
	if (idx !== -1) return idx + 5; // after title

	idx = html.indexOf('<div class="chord-sheet"');
	if (idx !== -1) return idx; // before sheet

	return -1;
}

export function injectMetadata(
	renderedHtml: string,
	creditsHtml: string,
	metaLineHtml: string,
): string {
	if (!creditsHtml && !metaLineHtml) return renderedHtml;

	const metadataHtml = creditsHtml + metaLineHtml;
	const insertionIdx = findInsertionIndex(renderedHtml);

	if (insertionIdx === -1) return renderedHtml;

	return (
		renderedHtml.slice(0, insertionIdx) +
		metadataHtml +
		renderedHtml.slice(insertionIdx)
	);
}