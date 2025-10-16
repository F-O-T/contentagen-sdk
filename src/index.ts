import { z } from "zod";
import type { ContentList, ContentSelect } from "./types";
import {
	AuthorByAgentIdSchema,
	ContentListResponseSchema,
	ContentSelectSchema,
	GetContentBySlugInputSchema,
	ImageSchema,
	ListContentByAgentInputSchema,
	RelatedSlugsResponseSchema,
	StreamAssistantResponseInputSchema,
} from "./types";

export const ERROR_CODES = {
	MISSING_API_KEY: {
		code: "SDK_E001",
		message: "apiKey is required to initialize the ContentaGenSDK",
	},
	API_REQUEST_FAILED: {
		code: "SDK_E002",
		message: "API request failed",
	},
	INVALID_API_RESPONSE: {
		code: "SDK_E003",
		message: "Invalid API response format.",
	},
	INVALID_INPUT: {
		code: "SDK_E004",
		message: "Invalid input.",
	},
};

export const API_ENDPOINTS = {
	listContentByAgent: "/content",
	getContentBySlug: "/content",
	getRelatedSlugs: "/related-slugs",
	getAuthorByAgentId: "/author",
	getContentImage: "/content/image",
	streamAssistantResponse: "/assistant",
};

const PRODUCTION_API_URL = "https://api.contentagen.com";

export interface SdkConfig {
	apiKey: string;
	locale?: string;
	host?: string;
}

export class ContentaGenSDK {
	private baseUrl: string;
	private apiKey: string;
	private locale?: string;

	constructor(config: SdkConfig) {
		if (!config.apiKey) {
			throw new Error("apiKey is required to initialize the ContentaGenSDK");
		}

		this.baseUrl = config.host || PRODUCTION_API_URL;
		this.apiKey = config.apiKey;
		this.locale = config.locale;
	}

	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			"sdk-api-key": this.apiKey,
		};

		if (this.locale) {
			headers["x-locale"] = this.locale;
		}

		return headers;
	}

	private transformDates(data: unknown): unknown {
		if (Array.isArray(data)) {
			return data.map((item) => this.transformDates(item));
		}
		if (data && typeof data === "object" && data !== null) {
			const obj: Record<string, unknown> = { ...data };
			for (const key of Object.keys(obj)) {
				if (
					(key === "createdAt" || key === "updatedAt") &&
					typeof obj[key] === "string"
				) {
					obj[key] = new Date(obj[key] as string);
				} else if (
					Array.isArray(obj[key]) ||
					(obj[key] && typeof obj[key] === "object")
				) {
					obj[key] = this.transformDates(obj[key]);
				}
			}
			return obj;
		}
		return data;
	}

	private _parseApiResponse<T>(json: unknown, schema: z.ZodType<T>): T {
		const transformedData = this.transformDates(json);
		return schema.parse(transformedData);
	}

	private async _get<T>(
		path: string,
		params: Record<string, unknown>,
		schema: z.ZodType<T>,
	): Promise<T> {
		const url = new URL(`${this.baseUrl}/sdk${path}`);
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					url.searchParams.set(key, value.join(","));
				} else {
					url.searchParams.set(key, String(value));
				}
			}
		});

		const fullUrl = url.toString();

		const response = await fetch(fullUrl, {
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			const errorText = await response.text();
			const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
			throw new Error(
				`${code}: ${message} (${response.statusText}) - ${errorText}`,
			);
		}

		const json = await response.json();
		return this._parseApiResponse(json, schema);
	}

	async listContentByAgent(
		params: z.input<typeof ListContentByAgentInputSchema>,
	): Promise<ContentList> {
		try {
			const validatedParams = ListContentByAgentInputSchema.parse(params);
			const { agentId, limit, page, status } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.listContentByAgent}/${agentId}`,
				{ limit, page, status },
				ContentListResponseSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for listContentByAgent: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getContentBySlug(
		params: z.input<typeof GetContentBySlugInputSchema>,
	): Promise<ContentSelect> {
		try {
			const validatedParams = GetContentBySlugInputSchema.parse(params);
			const { agentId, slug } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.getContentBySlug}/${agentId}/${slug}`,
				{},
				ContentSelectSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getContentBySlug: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getRelatedSlugs(
		params: z.input<typeof GetContentBySlugInputSchema>,
	): Promise<string[]> {
		try {
			const validatedParams = GetContentBySlugInputSchema.parse(params);
			const { agentId, slug } = validatedParams;
			return this._get(
				API_ENDPOINTS.getRelatedSlugs,
				{ agentId, slug },
				RelatedSlugsResponseSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getRelatedSlugs: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getAuthorByAgentId(
		params: Pick<z.input<typeof GetContentBySlugInputSchema>, "agentId">,
	): Promise<z.infer<typeof AuthorByAgentIdSchema>> {
		try {
			const validatedParams = GetContentBySlugInputSchema.pick({
				agentId: true,
			}).parse(params);
			const { agentId } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.getAuthorByAgentId}/${agentId}`,
				{},
				AuthorByAgentIdSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getAuthorByAgentId: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getContentImage(params: {
		contentId: string;
	}): Promise<z.infer<typeof ImageSchema>> {
		try {
			const validatedParams = z
				.object({ contentId: z.string().min(1, "Content ID is required") })
				.parse(params);
			const { contentId } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.getContentImage}/${contentId}`,
				{},
				ImageSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getContentImage: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async *streamAssistantResponse(
		params: z.input<typeof StreamAssistantResponseInputSchema>,
	): AsyncGenerator<string, void, unknown> {
		try {
			const validatedParams = StreamAssistantResponseInputSchema.parse(params);

			const { agentId, message } = validatedParams;

			// Use the URL constructor to safely build the URL with query parameters
			const url = new URL(
				`${this.baseUrl}/sdk${API_ENDPOINTS.streamAssistantResponse}`,
			);
			url.searchParams.set("agentId", agentId);
			url.searchParams.set("message", message);

			const fullUrl = url.toString();

			// Simple fetch call
			const response = await fetch(fullUrl, {
				method: "GET",
				headers: this.getHeaders(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
				throw new Error(
					`${code}: ${message} (${response.statusText}) - ${errorText}`,
				);
			}

			if (!response.body) {
				throw new Error("Response body is null, cannot create a stream.");
			}

			// Simple streaming - just like your server
			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				const chunk = decoder.decode(value);
				yield chunk;
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				const validationErrors = error.issues.map((e) => e.message).join(", ");
				throw new Error(
					`${code}: ${message} for streamAssistantResponse: ${validationErrors}`,
				);
			}
			throw error;
		}
	}
}

export const createSdk = (config: SdkConfig): ContentaGenSDK => {
	return new ContentaGenSDK(config);
};

export type { ShareStatus } from "./types";
export {
	AuthorByAgentIdSchema,
	ContentListResponseSchema,
	ContentSelectSchema,
	GetContentBySlugInputSchema,
	ImageSchema,
	ListContentByAgentInputSchema,
	ShareStatusValues,
	StreamAssistantResponseInputSchema,
} from "./types";
