import SuperJSON from 'superjson';
import { z } from 'zod';

// src/index.ts
var ContentStatsSchema = z.object({
  wordsCount: z.string().optional().describe("The number of words in the content."),
  readTimeMinutes: z.string().optional().describe("Estimated reading time in minutes."),
  qualityScore: z.string().optional().describe("A score representing the quality of the content.")
});
var ContentMetaSchema = z.object({
  title: z.string().optional().describe("The title of the content."),
  slug: z.string().optional().describe("A URL-friendly identifier for the content."),
  tags: z.array(z.string()).optional().describe("Tags associated with the content."),
  topics: z.array(z.string()).optional().describe("Topics covered in the content."),
  sources: z.array(z.string()).optional().describe("Sources referenced for the content.")
});
var ContentRequestSchema = z.object({
  description: z.string().min(1, "Description is required")
});
var ContentStatusValues = ["draft", "approved", "generating"];
var ListContentByAgentInputSchema = z.object({
  status: z.enum(ContentStatusValues, {
    message: "Invalid content status. Must be one of: draft, approved, generating."
  }).array(),
  agentId: z.uuid("Invalid Agent ID format."),
  limit: z.number().min(1).max(100).optional().default(10),
  page: z.number().min(1).optional().default(1)
});
var GetContentByIdInputSchema = z.object({
  id: z.uuid("Invalid Content ID format.")
});
var GetContentBySlugInputSchema = z.object({
  slug: z.string().min(1, "Slug is required.")
});
var ContentSelectSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  imageUrl: z.string().nullable(),
  userId: z.string(),
  body: z.string(),
  status: z.enum(ContentStatusValues),
  meta: ContentMetaSchema,
  request: ContentRequestSchema,
  stats: ContentStatsSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});
var ContentListResponseSchema = z.object({
  posts: ContentSelectSchema.pick({
    id: true,
    meta: true,
    imageUrl: true,
    status: true,
    createdAt: true,
    stats: true
  }).array(),
  total: z.number()
});

// src/index.ts
var ERROR_CODES = {
  MISSING_API_KEY: {
    code: "SDK_E001",
    message: "apiKey is required to initialize the ContentaGenSDK"
  },
  API_REQUEST_FAILED: {
    code: "SDK_E002",
    message: "API request failed"
  },
  INVALID_API_RESPONSE: {
    code: "SDK_E003",
    message: "Invalid API response format."
  },
  INVALID_INPUT: {
    code: "SDK_E004",
    message: "Invalid input."
  }
};
var TRPC_ENDPOINTS = {
  listContentByAgent: "listContentByAgent",
  getContentById: "getContentById",
  getContentBySlug: "getContentBySlug"
};
var PRODUCTION_API_URL = "https://api.contentagen.com";
var ContentaGenSDK = class {
  trpcUrl;
  apiKey;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("apiKey is required to initialize the ContentaGenSDK");
    }
    const baseUrl = PRODUCTION_API_URL;
    this.trpcUrl = `${baseUrl}/trpc`;
    this.apiKey = config.apiKey;
  }
  transformDates(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.transformDates(item));
    }
    if (data && typeof data === "object" && data !== null) {
      const obj = { ...data };
      for (const key of Object.keys(obj)) {
        if ((key === "createdAt" || key === "updatedAt") && typeof obj[key] === "string") {
          obj[key] = new Date(obj[key]);
        } else if (Array.isArray(obj[key]) || obj[key] && typeof obj[key] === "object") {
          obj[key] = this.transformDates(obj[key]);
        }
      }
      return obj;
    }
    return data;
  }
  _parseTrpcResponse(json, schema) {
    if (json && typeof json === "object" && "result" in json && json.result && typeof json.result === "object" && "data" in json.result) {
      const resultObj = json.result;
      const responseData = resultObj.data;
      const actualData = typeof responseData === "object" && responseData !== null && "json" in responseData ? responseData.json : responseData;
      const transformedData = this.transformDates(actualData);
      return schema.parse(transformedData);
    }
    const { code, message } = ERROR_CODES.INVALID_API_RESPONSE;
    throw new Error(`${code}: ${message}`);
  }
  async _query(path, input, schema) {
    const url = new URL(`${this.trpcUrl}/sdk.${path}`);
    if (input) {
      url.searchParams.set("input", SuperJSON.stringify(input));
    }
    const response = await fetch(url.toString(), {
      headers: { "sdk-api-key": this.apiKey }
    });
    if (!response.ok) {
      const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
      throw new Error(`${code}: ${message} (${response.statusText})`);
    }
    const json = await response.json();
    return this._parseTrpcResponse(json, schema);
  }
  async listContentByAgent(params) {
    try {
      const validatedParams = ListContentByAgentInputSchema.parse(params);
      return this._query(
        TRPC_ENDPOINTS.listContentByAgent,
        validatedParams,
        ContentListResponseSchema
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const { code, message } = ERROR_CODES.INVALID_INPUT;
        throw new Error(
          `${code}: ${message} for listContentByAgent: ${error.issues.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }
  async getContentById(params) {
    try {
      const validatedParams = GetContentByIdInputSchema.parse(params);
      return this._query(
        TRPC_ENDPOINTS.getContentById,
        validatedParams,
        ContentSelectSchema
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const { code, message } = ERROR_CODES.INVALID_INPUT;
        throw new Error(
          `${code}: ${message} for getContentById: ${error.issues.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }
  async getContentBySlug(params) {
    try {
      const validatedParams = GetContentBySlugInputSchema.parse(params);
      return this._query(
        TRPC_ENDPOINTS.getContentBySlug,
        validatedParams,
        ContentSelectSchema
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const { code, message } = ERROR_CODES.INVALID_INPUT;
        throw new Error(
          `${code}: ${message} for getContentBySlug: ${error.issues.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }
};
var createSdk = (config) => {
  return new ContentaGenSDK(config);
};

export { ContentListResponseSchema, ContentSelectSchema, ContentaGenSDK, ERROR_CODES, GetContentByIdInputSchema, GetContentBySlugInputSchema, ListContentByAgentInputSchema, TRPC_ENDPOINTS, createSdk };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map