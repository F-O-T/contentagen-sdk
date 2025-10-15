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
						shareStatus: "private",
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
				shareStatus: "private",
				meta: {
					title: "Test Title",
					slug: "test-title",
					description: "Test description",
					keywords: ["tag1"],
					sources: ["source1"],
				},
				request: { description: "desc", layout: "tutorial" },
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

// streamAssistantResponse tests
const validStreamInput = { message: "Hello, assistant!" };
const mockStreamChunks = ["Hello", " there", "!", " How", " can", " I", " help", " you", "?"];

describe("ContentaGenSDK.streamAssistantResponse", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("streams response chunks for valid input", async () => {
		// Create a mock readable stream
		const stream = new ReadableStream({
			start(controller) {
				mockStreamChunks.forEach((chunk) => {
					controller.enqueue(new TextEncoder().encode(chunk));
				});
				controller.close();
			},
		});

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			body: stream,
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const chunks: string[] = [];
		for await (const chunk of sdk.streamAssistantResponse(validStreamInput)) {
			chunks.push(chunk);
		}

		expect(chunks).toEqual(mockStreamChunks);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/trpc/sdk.streamAssistantResponse"),
			{
				headers: {
					"sdk-api-key": apiKey,
					"Accept": "text/event-stream",
					"Content-Type": "application/json"
				},
			},
		);
	});

	it("throws on invalid input", async () => {
		// Test empty string
		const stream1 = sdk.streamAssistantResponse({ message: "" });
		await expect(stream1.next()).rejects.toThrow(/SDK_E004.*Message is required/);

		// Test non-string type
		const stream2 = sdk.streamAssistantResponse({ message: 123 as any });
		await expect(stream2.next()).rejects.toThrow(/SDK_E004/);
	});

	it("throws on API error", async () => {
		fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			statusText: "Internal Server Error",
			body: null,
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const stream = sdk.streamAssistantResponse(validStreamInput);
		await expect(stream.next()).rejects.toThrow(/SDK_E002/);
	});

	it("throws when response body is null", async () => {
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			body: null,
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const stream = sdk.streamAssistantResponse(validStreamInput);
		await expect(stream.next()).rejects.toThrow("No response body received for streaming");
	});

	it("handles empty stream", async () => {
		// Create a mock empty stream
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			body: stream,
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const chunks: string[] = [];
		for await (const chunk of sdk.streamAssistantResponse(validStreamInput)) {
			chunks.push(chunk);
		}

		expect(chunks).toEqual([]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("handles stream with single chunk", async () => {
		const singleChunk = ["Single response"];

		// Create a mock stream with single chunk
		const stream = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode(singleChunk[0]));
				controller.close();
			},
		});

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			body: stream,
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const chunks: string[] = [];
		for await (const chunk of sdk.streamAssistantResponse(validStreamInput)) {
			chunks.push(chunk);
		}

		expect(chunks).toEqual(singleChunk);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("handles stream errors", async () => {
		// Create a mock stream that errors
		const stream = new ReadableStream({
			start(controller) {
				controller.error(new Error("Stream error"));
			},
		});

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			body: stream,
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const streamGenerator = sdk.streamAssistantResponse(validStreamInput);
		await expect(streamGenerator.next()).rejects.toThrow("Stream error");
	});

	it("validates input parameters correctly", async () => {
		const testCases = [
			{ input: { message: "Valid message" }, shouldPass: true },
			{ input: { message: "" }, shouldPass: false, expectedError: "Message is required" },
			{ input: { message: "a".repeat(1000) }, shouldPass: true },
			{ input: {}, shouldPass: false },
			{ input: { message: null }, shouldPass: false },
			{ input: { message: undefined }, shouldPass: false },
		];

		for (const testCase of testCases) {
			if (testCase.shouldPass) {
				// Should not throw during validation
				const stream = new ReadableStream({
					start(controller) {
						controller.close();
					},
				});

				fetchMock = vi.fn().mockResolvedValue({
					ok: true,
					body: stream,
					statusText: "OK",
				});
				globalThis.fetch = fetchMock as unknown as typeof fetch;

				const chunks: string[] = [];
				try {
					for await (const chunk of sdk.streamAssistantResponse(testCase.input as any)) {
						chunks.push(chunk);
					}
					// If we get here, validation passed
					expect(true).toBe(true);
				} catch (error) {
					// If it throws, it should be an API error, not validation error
					expect((error as Error).message).not.toContain("SDK_E004");
				}
			} else {
				const stream = sdk.streamAssistantResponse(testCase.input as any);
				const expectedError = (testCase as any).expectedError || "SDK_E004";
				await expect(stream.next()).rejects.toThrow(expectedError);
			}
		}
	});

	it("properly constructs URL with input parameters", async () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			body: stream,
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const input = { message: "Test message with special chars: !@#$%" };
		for await (const chunk of sdk.streamAssistantResponse(input)) {
			// Consume the stream
		}

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calledUrl = fetchMock.mock.calls[0][0];
		expect(calledUrl).toContain("/trpc/sdk.streamAssistantResponse");
		expect(calledUrl).toContain("input=");
		// The input should be URL encoded with SuperJSON
		// Check for URL encoded version of the special characters
		expect(calledUrl).toContain("Test+message+with+special+chars");
		expect(calledUrl).toContain("%21%40%23%24%25"); // URL encoded !@#$%
	});
});

// Locale and language tests
describe("ContentaGenSDK locale functionality", () => {
	beforeEach(() => {
		sdk = createSdk({ apiKey, locale: "pt-BR" });
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

	it("includes x-locale header in regular API requests", async () => {
		await sdk.listContentByAgent(validListInput);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			{
				headers: {
					"sdk-api-key": apiKey,
					"x-locale": "pt-BR",
				},
			},
		);
	});

	it("includes x-locale header in streaming requests", async () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		fetchMock.mockResolvedValueOnce({
			ok: true,
			body: stream,
			statusText: "OK",
		});

		for await (const chunk of sdk.streamAssistantResponse({ message: "Test" })) {
			// Consume the stream
		}

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			{
				headers: {
					"sdk-api-key": apiKey,
					"x-locale": "pt-BR",
					"Accept": "text/event-stream",
					"Content-Type": "application/json"
				},
			},
		);
	});

	it("does not include x-locale header when locale is not provided", async () => {
		const sdkWithoutLocale = createSdk({ apiKey });
		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockListResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await sdkWithoutLocale.listContentByAgent(validListInput);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			{
				headers: {
					"sdk-api-key": apiKey,
				},
			},
		);
	});

	it("handles language field with default value in streamAssistantResponse", async () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		fetchMock.mockResolvedValueOnce({
			ok: true,
			body: stream,
			statusText: "OK",
		});

		// Test without language field (should default to "en")
		for await (const chunk of sdk.streamAssistantResponse({ message: "Test" })) {
			// Consume the stream
		}

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calledUrl = fetchMock.mock.calls[0][0];
		expect(calledUrl).toContain("input=");
		expect(calledUrl).toContain("language"); // Should include the default language

		// Test with explicit language field
		fetchMock.mockResolvedValueOnce({
			ok: true,
			body: stream,
			statusText: "OK",
		});

		for await (const chunk of sdk.streamAssistantResponse({ message: "Test", language: "pt" })) {
			// Consume the stream
		}

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const secondCallUrl = fetchMock.mock.calls[1][0];
		expect(secondCallUrl).toContain("language");
		expect(secondCallUrl).toContain("pt"); // Should include explicit language
	});

	it("validates language field in streamAssistantResponse", async () => {
		const stream = sdk.streamAssistantResponse({
			message: "Test",
			language: "invalid" as any
		});
		await expect(stream.next()).rejects.toThrow(/SDK_E004.*Invalid input/);
	});

	it("accepts both supported language values", async () => {
		const stream = new ReadableStream({
			start(controller) {
				controller.close();
			},
		});

		fetchMock.mockResolvedValue({
			ok: true,
			body: stream,
			statusText: "OK",
		});

		// Test English
		for await (const chunk of sdk.streamAssistantResponse({ message: "Test", language: "en" })) {
			// Should not throw
		}

		// Test Portuguese
		for await (const chunk of sdk.streamAssistantResponse({ message: "Test", language: "pt" })) {
			// Should not throw
		}

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("uses custom host when provided", async () => {
		const customSdk = createSdk({
			apiKey,
			host: "https://custom.api.example.com"
		});

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockListResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await customSdk.listContentByAgent(validListInput);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calledUrl = fetchMock.mock.calls[0][0];
		expect(calledUrl).toContain("https://custom.api.example.com/trpc");
		expect(calledUrl).not.toContain("api.contentagen.com");
	});

	it("defaults to production API when no host is provided", async () => {
		const defaultSdk = createSdk({ apiKey });

		fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockListResponse),
			statusText: "OK",
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await defaultSdk.listContentByAgent(validListInput);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const calledUrl = fetchMock.mock.calls[0][0];
		expect(calledUrl).toContain("https://api.contentagen.com/trpc");
	});
});
