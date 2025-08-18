import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as extract from "../scripts/extract-changelog";

const FIXTURE_CHANGELOG = `# Changelog

## [1.0.0] - 2024-01-01

- Initial release

## [0.9.0] - 2023-12-01

- Beta`;

describe("extract-changelog", () => {
	it("reads changelog file", async () => {
		const tmp = path.resolve("CHANGELOG.test.md");
		await fs.writeFile(tmp, FIXTURE_CHANGELOG);
		const text = await extract.readChangelog(tmp);
		expect(text).toContain("Initial release");
		await fs.unlink(tmp);
	});

	it("extracts entry for version", () => {
		const entry = extract.extractForVersion(FIXTURE_CHANGELOG, "1.0.0");
		expect(entry).toContain("Initial release");
	});

	it("returns null for missing version", () => {
		const entry = extract.extractForVersion(FIXTURE_CHANGELOG, "2.0.0");
		expect(entry).toBeNull();
	});

	it("reads version from package.json", async () => {
		const tmp = path.resolve("package.test.json");
		await fs.writeFile(tmp, JSON.stringify({ version: "9.9.9" }));
		const v = await extract.extractVersionFromPackageJson(tmp);
		expect(v).toBe("9.9.9");
		await fs.unlink(tmp);
	});
});

describe("create-release", () => {
	const envBackup = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...envBackup } as any;
	});

	afterEach(() => {
		process.env = envBackup;
	});

	it("throws without GITHUB_TOKEN", async () => {
		const mod = await import("../scripts/create-release");
		await expect(mod.run?.()).rejects.toThrow(/GITHUB_TOKEN required/);
	});

	it("errors when changelog entry missing", async () => {
		process.env.GITHUB_TOKEN = "fake";
		process.env.GITHUB_REPOSITORY = "owner/repo";
		// set tag to a version not in test changelog
		process.env.TAG = "v2.0.0";
		// stub readChangelog to return minimal content
		const stub = vi
			.spyOn(extract, "readChangelog")
			.mockResolvedValue(FIXTURE_CHANGELOG);
		const mod = await import("../scripts/create-release");
		await expect(mod.run()).rejects.toThrow(/Changelog entry not found/);
		stub.mockRestore();
	});
});
