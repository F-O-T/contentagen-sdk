import fs from "fs/promises";
import path from "path";

export async function readChangelog(file = "CHANGELOG.md"): Promise<string> {
	const p = path.resolve(file);
	return await fs.readFile(p, "utf8");
}

export function extractForVersion(
	changelogText: string,
	version: string,
): string | null {
	if (!changelogText) return null;
	const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const headerRegex = new RegExp(`^##+\\s*\\[?${escaped}\\]?\\b.*$`, "m");
	const lines = changelogText.split(/\r?\n/);

	let start = -1;
	let headerLevel = 0;
	for (let i = 0; i < lines.length; i++) {
		if (headerRegex.test(lines[i])) {
			start = i + 1;
			const m = lines[i].match(/^(#+)/);
			headerLevel = m ? m[1].length : 2;
			break;
		}
	}
	if (start === -1) return null;

	let end = lines.length;
	const nextHeader = new RegExp(`^#{1,${headerLevel}}\\s+`);
	for (let i = start; i < lines.length; i++) {
		if (nextHeader.test(lines[i])) {
			end = i;
			break;
		}
	}

	const block = lines.slice(start, end).join("\n").trim();
	return block || null;
}

export async function extractVersionFromPackageJson(
	pkgPath = "package.json",
): Promise<string> {
	const p = path.resolve(pkgPath);
	const json = JSON.parse(await fs.readFile(p, "utf8"));
	return json.version as string;
}

export function parseAllVersions(
	changelogText: string,
): Array<{ version: string; body: string }> {
	if (!changelogText) return [];
	const lines = changelogText.split(/\r?\n/);
	const entries: Array<{ version: string; body: string }> = [];
	const headerRe = /^##+\s*\[?([^\]\s]+)\]?\b.*$/; // capture version-like token after ##
	let i = 0;
	while (i < lines.length) {
		const m = lines[i].match(headerRe);
		if (m) {
			const version = m[1];
			const levelMatch = lines[i].match(/^(#+)/);
			const headerLevel = levelMatch ? levelMatch[1].length : 2;
			let start = i + 1;
			let end = lines.length;
			const nextHeader = new RegExp(`^#{1,${headerLevel}}\\s+`);
			for (let j = start; j < lines.length; j++) {
				if (nextHeader.test(lines[j])) {
					end = j;
					break;
				}
			}
			const body = lines.slice(start, end).join("\n").trim();
			entries.push({ version, body });
			i = end;
		} else {
			i++;
		}
	}
	return entries;
}
