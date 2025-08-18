import fs from "fs";
import path from "path";

export function readChangelog(file = "CHANGELOG.md") {
	const p = path.resolve(file);
	return fs.readFileSync(p, "utf8");
}

export function extractForVersion(changelogText, version) {
	if (!changelogText) return null;
	// Support versions with or without brackets and optional leading v in version
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

export function extractVersionFromPackageJson(pkgPath = "package.json") {
	const p = path.resolve(pkgPath);
	const json = JSON.parse(fs.readFileSync(p, "utf8"));
	return json.version;
}
