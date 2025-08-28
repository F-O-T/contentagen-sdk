import { execSync } from "child_process";
import fs from "fs/promises";
import { extractForVersion, readChangelog } from "./extract-changelog";

export async function isVersionPublished(
	pkgName: string,
	version: string,
): Promise<boolean> {
	try {
		const output = execSync(`npm view ${pkgName} versions --json`, {
			encoding: "utf8",
		});
		const versions = JSON.parse(output);
		return versions.includes(version);
	} catch (err) {
		// If package not found, treat as not published
		return false;
	}
}

async function main() {
	const pkgJson = JSON.parse(await fs.readFile("package.json", "utf8"));
	const pkgName = pkgJson.name;
	const version = pkgJson.version;

	const changelog = await readChangelog();
	const changelogEntry = extractForVersion(changelog, version);
	if (!changelogEntry) {
		console.error(`No changelog entry found for version ${version}`);
		process.exit(1);
	}

	const published = await isVersionPublished(pkgName, version);
	if (published) {
		console.log(`Version ${version} is already published to npm.`);
		process.exit(0);
	}

	// Build step
	console.log("Building the app...");
	execSync("bun run build", { stdio: "inherit" });

	// Publish step
	console.log("Publishing to npm...");
	execSync("npm publish", { stdio: "inherit" });

	console.log(`Published version ${version} to npm.`);
}

if (
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("publish-release.ts")
) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
