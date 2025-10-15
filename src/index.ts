import SuperJSON from "superjson";
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

export const TRPC_ENDPOINTS = {
	listContentByAgent: "listContentByAgent",
	getContentBySlug: "getContentBySlug",
	getRelatedSlugs: "getRelatedSlugs",
	getAuthorByAgentId: "getAuthorByAgentId",
	getContentImage: "getContentImage",
	streamAssistantResponse: "streamAssistantResponse",
};

const PRODUCTION_API_URL = "https://api.contentagen.com";

export interface SdkConfig {
	apiKey: string;
	locale?: string;
	host?: string;
}

export class ContentaGenSDK {
	private trpcUrl: string;
	private apiKey: string;
	private locale?: string;

	constructor(config: SdkConfig) {
		if (!config.apiKey) {
			throw new Error("apiKey is required to initialize the ContentaGenSDK");
		}

		const baseUrl = config.host || PRODUCTION_API_URL;

		this.trpcUrl = `${baseUrl}/trpc`;
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

	private _parseTrpcResponse<T>(json: unknown, schema: z.ZodType<T>): T {
		if (
			json &&
			typeof json === "object" &&
			"result" in json &&
			(json as { result: unknown }).result &&
			typeof (json as { result: unknown }).result === "object" &&
			"data" in (json as { result: { data: unknown } }).result
		) {
			const resultObj = (json as { result: { data: unknown } }).result;
			const responseData = resultObj.data;
			// Safely extract json property if exists, or use responseData
			const actualData =
				typeof responseData === "object" &&
					responseData !== null &&
					"json" in responseData
					? (responseData as { json: unknown }).json
					: responseData;
			const transformedData = this.transformDates(actualData);
			return schema.parse(transformedData);
		}
		const { code, message } = ERROR_CODES.INVALID_API_RESPONSE;
		throw new Error(`${code}: ${message}`);
	}

	private async _query<T>(
		path: string,
		input: unknown,
		schema: z.ZodType<T>,
	): Promise<T> {
		const url = new URL(`${this.trpcUrl}/sdk.${path}`);
		if (input) {
			url.searchParams.set("input", SuperJSON.stringify(input));
		}

		const response = await fetch(url.toString(), {
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
			throw new Error(`${code}: ${message} (${response.statusText})`);
		}

		const json = await response.json();
		return this._parseTrpcResponse(json, schema);
	}
	async listContentByAgent(
		params: z.input<typeof ListContentByAgentInputSchema>,
	): Promise<ContentList> {
		try {
			const validatedParams = ListContentByAgentInputSchema.parse(params);
			return this._query(
				TRPC_ENDPOINTS.listContentByAgent,
				validatedParams,
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
			return this._query(
				TRPC_ENDPOINTS.getContentBySlug,
				validatedParams,
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
			return this._query(
				TRPC_ENDPOINTS.getRelatedSlugs,
				validatedParams,
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
			return this._query(
				TRPC_ENDPOINTS.getAuthorByAgentId,
				validatedParams,
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
			return this._query(
				TRPC_ENDPOINTS.getContentImage,
				validatedParams,
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

	async streamAssistantResponse(
		params: z.input<typeof StreamAssistantResponseInputSchema>,
	): Promise<z.infer<typeof StreamAssistantResponseInputSchema>> {
		try {
			const validatedParams = StreamAssistantResponseInputSchema.parse(params);
			return this._query(
				TRPC_ENDPOINTS.streamAssistantResponse,
				validatedParams,
				StreamAssistantResponseInputSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for streamAssistantResponse: ${error.issues.map((e) => e.message).join(", ")}`,
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
