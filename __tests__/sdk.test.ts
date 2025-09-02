import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSdk } from "../src/index";

const apiKey = "test-api-key";
const agentId = "123e4567-e89b-12d3-a456-426614174000";
let sdk: ReturnType<typeof createSdk>;
let fetchMock: ReturnType<typeof vi.fn>;

// listContentByAgent tests
const validListInput = {
	status: ["draft", "approved"] as Array<"draft" | "approved">,
	agentId: [agentId],
	limit: 2,
	page: 1,
};
const mockListResponse = {
	result: {
		data: {
			json: {
				posts: [
					{
						id: "post1",
						meta: {
							title: "Test Title",
							slug: "test-title",
							description: "Test description",
							keywords: ["tag1"],
							sources: ["source1"],
						},
						imageUrl: null,
						image: null,
						status: "draft",
						createdAt: new Date().toISOString(),
						stats: {
							wordsCount: "100",
							readTimeMinutes: "2",
							qualityScore: "A",
						},
					},
				],
				total: 1,
			},
		},
	},
};

describe("ContentaGenSDK.listContentByAgent", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey });
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockListResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns parsed content list for valid input", async () => {
		const result = await sdk.listContentByAgent(validListInput);
		const expected = {
			...mockListResponse.result.data.json,
			posts: mockListResponse.result.data.json.posts.map((post) => ({
				...post,
				createdAt: new Date(post.createdAt),
			})),
		};
		expect(result).toEqual(expected);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws on invalid input", async () => {
		await expect(
			sdk.listContentByAgent({ ...validListInput, agentId: ["not-a-uuid"] }),
		).rejects.toThrow(/SDK_E004/);
	});

	it("throws on API error", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
			json: () => Promise.resolve({}),
		});
		await expect(sdk.listContentByAgent(validListInput)).rejects.toThrow(
			/SDK_E002/,
		);
	});
});

// getContentBySlug tests
const validSlugInput = { slug: "test-title", agentId };
const mockSlugResponse = {
	result: {
		data: {
			json: {
				id: "post1",
				agentId,
				imageUrl: null,
				image: null,
				body: "Test body",
				status: "draft",
				meta: {
					title: "Test Title",
					slug: "test-title",
					description: "Test description",
					keywords: ["tag1"],
					sources: ["source1"],
				},
				request: { description: "desc" },
				stats: {
					wordsCount: "100",
					readTimeMinutes: "2",
					qualityScore: "A",
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		},
	},
};

describe("ContentaGenSDK.getContentBySlug", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey });
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockSlugResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns parsed content for valid input", async () => {
		const result = await sdk.getContentBySlug(validSlugInput);
		const { ...rest } = mockSlugResponse.result.data.json;
		const expected = {
			...rest,
			createdAt: new Date(mockSlugResponse.result.data.json.createdAt),
			updatedAt: new Date(mockSlugResponse.result.data.json.updatedAt),
		};
		expect(result).toEqual(expected);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws on invalid input", async () => {
		await expect(sdk.getContentBySlug({ slug: "", agentId })).rejects.toThrow(
			/SDK_E004/,
		);
	});

	it("throws on API error", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
			json: () => Promise.resolve({}),
		});
		await expect(sdk.getContentBySlug(validSlugInput)).rejects.toThrow(
			/SDK_E002/,
		);
	});
});

// getAuthorByAgentId tests
const validAuthorInput = { agentId };
const mockAuthorResponse = {
	result: {
		data: {
			json: {
				name: "Agent Name",
				profilePhoto: {
					data: "base64string",
					contentType: "image/png",
				},
			},
		},
	},
};

describe("ContentaGenSDK.getAuthorByAgentId", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey });
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockAuthorResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns author info for valid input", async () => {
		const result = await sdk.getAuthorByAgentId(validAuthorInput);
		expect(result).toEqual(mockAuthorResponse.result.data.json);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws on invalid input", async () => {
		await expect(
			sdk.getAuthorByAgentId({ agentId: "not-a-uuid" }),
		).rejects.toThrow(/SDK_E004/);
	});

	it("throws on API error", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
			json: () => Promise.resolve({}),
		});
		await expect(sdk.getAuthorByAgentId(validAuthorInput)).rejects.toThrow(
			/SDK_E002/,
		);
	});
});

// getRelatedSlugs tests
const validRelatedInput = { slug: "test-title", agentId };
const mockRelatedResponse = {
	result: {
		data: {
			json: ["related-slug-1", "related-slug-2", "related-slug-3"],
		},
	},
};

describe("ContentaGenSDK.getRelatedSlugs", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey });
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockRelatedResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns array of related slugs for valid input", async () => {
		const result = await sdk.getRelatedSlugs(validRelatedInput);
		expect(result).toEqual([
			"related-slug-1",
			"related-slug-2",
			"related-slug-3",
		]);
		expect(Array.isArray(result)).toBe(true);
		expect(result.every((slug) => typeof slug === "string")).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("throws on invalid input", async () => {
		await expect(sdk.getRelatedSlugs({ slug: "", agentId })).rejects.toThrow(
			/SDK_E004/,
		);
	});

	it("throws on API error", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
			json: () => Promise.resolve({}),
		});
		await expect(sdk.getRelatedSlugs(validRelatedInput)).rejects.toThrow(
			/SDK_E002/,
		);
	});
});

// getContentImage tests
const validContentImageInput = { contentId: "content-123" };
const mockContentImageResponse = {
	result: {
		data: {
			json: {
				data: "base64imagedata",
				contentType: "image/jpeg",
			},
		},
	},
};

describe("ContentaGenSDK.getContentImage", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey });
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockContentImageResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns image data for valid input", async () => {
		const result = await sdk.getContentImage(validContentImageInput);
		expect(result).toEqual(mockContentImageResponse.result.data.json);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("returns null when no image exists", async () => {
		const nullResponse = {
			result: {
				data: {
					json: null,
				},
			},
		};
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(nullResponse),
			statusText: "OK",
		});
		const result = await sdk.getContentImage(validContentImageInput);
		expect(result).toBeNull();
	});

	it("throws on invalid input", async () => {
		await expect(sdk.getContentImage({ contentId: "" })).rejects.toThrow(
			/SDK_E004/,
		);
	});

	it("throws on API error", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
			json: () => Promise.resolve({}),
		});
		await expect(sdk.getContentImage(validContentImageInput)).rejects.toThrow(
			/SDK_E002/,
		);
	});
});
