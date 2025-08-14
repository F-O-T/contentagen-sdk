import { z } from 'zod';

declare const ListContentByAgentInputSchema: z.ZodObject<{
    status: z.ZodArray<z.ZodEnum<{
        draft: "draft";
        approved: "approved";
        generating: "generating";
    }>>;
    agentId: z.ZodUUID;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
declare const GetContentByIdInputSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
declare const GetContentBySlugInputSchema: z.ZodObject<{
    slug: z.ZodString;
}, z.core.$strip>;
declare const ContentSelectSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodString>;
    userId: z.ZodString;
    body: z.ZodString;
    status: z.ZodEnum<{
        draft: "draft";
        approved: "approved";
        generating: "generating";
    }>;
    meta: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        topics: z.ZodOptional<z.ZodArray<z.ZodString>>;
        sources: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    request: z.ZodObject<{
        description: z.ZodString;
    }, z.core.$strip>;
    stats: z.ZodObject<{
        wordsCount: z.ZodOptional<z.ZodString>;
        readTimeMinutes: z.ZodOptional<z.ZodString>;
        qualityScore: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
declare const ContentListResponseSchema: z.ZodObject<{
    posts: z.ZodArray<z.ZodObject<{
        createdAt: z.ZodDate;
        status: z.ZodEnum<{
            draft: "draft";
            approved: "approved";
            generating: "generating";
        }>;
        meta: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            slug: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            topics: z.ZodOptional<z.ZodArray<z.ZodString>>;
            sources: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        stats: z.ZodObject<{
            wordsCount: z.ZodOptional<z.ZodString>;
            readTimeMinutes: z.ZodOptional<z.ZodString>;
            qualityScore: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        id: z.ZodString;
        imageUrl: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
type ContentList = z.infer<typeof ContentListResponseSchema>;
type ContentSelect = z.infer<typeof ContentSelectSchema>;

declare const ERROR_CODES: {
    MISSING_API_KEY: {
        code: string;
        message: string;
    };
    API_REQUEST_FAILED: {
        code: string;
        message: string;
    };
    INVALID_API_RESPONSE: {
        code: string;
        message: string;
    };
    INVALID_INPUT: {
        code: string;
        message: string;
    };
};
declare const TRPC_ENDPOINTS: {
    listContentByAgent: string;
    getContentById: string;
    getContentBySlug: string;
};
interface SdkConfig {
    apiKey: string;
}
declare class ContentaGenSDK {
    private trpcUrl;
    private apiKey;
    constructor(config: SdkConfig);
    private transformDates;
    private _parseTrpcResponse;
    private _query;
    listContentByAgent(params: z.input<typeof ListContentByAgentInputSchema>): Promise<ContentList>;
    getContentById(params: z.input<typeof GetContentByIdInputSchema>): Promise<ContentSelect>;
    getContentBySlug(params: z.input<typeof GetContentBySlugInputSchema>): Promise<ContentSelect>;
}
declare const createSdk: (config: SdkConfig) => ContentaGenSDK;

export { ContentListResponseSchema, ContentSelectSchema, ContentaGenSDK, ERROR_CODES, GetContentByIdInputSchema, GetContentBySlugInputSchema, ListContentByAgentInputSchema, type SdkConfig, TRPC_ENDPOINTS, createSdk };
