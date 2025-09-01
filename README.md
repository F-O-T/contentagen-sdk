# ContentaGen SDK

Official TypeScript SDK for interacting with the ContentaGen API.

## Features
- Lightweight client for ContentaGen API
- Input validation with Zod schemas
- Automatic date parsing for `createdAt` / `updatedAt`
- Consistent error codes and robust error handling
- Agents can be used as authors (author info is derived from the agent config)
- New procedures: `getAuthorByAgentId`, `getRelatedSlugs`
- All types and schemas exported for advanced usage

## Installation

npm:
```bash
npm install @contentagen/sdk
```

yarn:
```bash
yarn add @contentagen/sdk
```

## Quick Start (TypeScript)

```ts
import { createSdk } from "@contentagen/sdk";
import type { ContentList, ContentSelect } from "@contentagen/sdk";

const sdk = createSdk({ apiKey: "YOUR_API_KEY" });

async function example() {
  // List content by agent(s)
  const listParams = {
    agentId: ["00000000-0000-0000-0000-000000000000"], // array of UUIDs
    status: ["approved", "draft"], // required array of statuses
    limit: 10, // optional, default 10
    page: 1, // optional, default 1
  };
  const list: ContentList = await sdk.listContentByAgent(listParams);
  console.log("total:", list.total);
  console.log("posts:", list.posts);

  // Get content by slug
  const selectParams = {
    slug: "my-post-slug",
    agentId: "00000000-0000-0000-0000-000000000000",
  };
  const post: ContentSelect = await sdk.getContentBySlug(selectParams);
  console.log(post.id, post.meta.title, post.createdAt);

  // Get related slugs for a post
  const relatedSlugs = await sdk.getRelatedSlugs({
    slug: "my-post-slug",
    agentId: "00000000-0000-0000-0000-000000000000",
  });
  console.log("Related slugs:", relatedSlugs);

  // Get author info by agent ID
  const author = await sdk.getAuthorByAgentId({
    agentId: "00000000-0000-0000-0000-000000000000",
  });
  console.log("Author name:", author.name);
  console.log("Profile photo:", author.profilePhoto?.image);
}
```

## API

### Exports
- `createSdk(config: { apiKey: string }): ContentaGenSDK` — factory for SDK instance
- `ContentaGenSDK` class — all methods available on instances
- `createPostHogHelper(): PostHogHelper` — factory for PostHog analytics helper
- `PostHogHelper` class — analytics tracking utilities for blog posts
- Zod schemas for advanced validation:
  - `ContentListResponseSchema`
  - `ContentSelectSchema`
  - `GetContentBySlugInputSchema`
  - `ListContentByAgentInputSchema`
  - `AuthorByAgentIdSchema`
  - `RelatedSlugsResponseSchema`

### Methods

- `sdk.listContentByAgent(params)`
  - params (validated by `ListContentByAgentInputSchema`):
    - `agentId`: string[] (UUIDs) — required
    - `status`: ("draft" | "approved")[] — required
    - `limit?: number` — optional, default 10, between 1 and 100
    - `page?: number` — optional, default 1, min 1
  - Returns: `Promise<ContentList>`

- `sdk.getContentBySlug(params)`
  - params (validated by `GetContentBySlugInputSchema`):
    - `slug`: string — required
    - `agentId`: string (UUID) — required
  - Returns: `Promise<ContentSelect>`

- `sdk.getRelatedSlugs(params)`
  - params: `{ slug: string; agentId: string }`
  - Returns: `Promise<string[]>` (array of related slugs)

- `sdk.getAuthorByAgentId(params)`
  - params: `{ agentId: string }`
  - Returns: `{ name: string; profilePhoto: { image: string; contentType: string } | null }`
  - Note: The agent serves as the author. The returned name and profile photo are derived directly from the agent config.

### PostHog Analytics Helper

The SDK includes a PostHog helper for tracking blog post views and custom events, designed for build-time frameworks like AstroJS.

#### PostHogHelper Methods

- `posthogHelper.trackBlogPostView(postData)`
  - params: `{ id: string; slug: string; title?: string; agentId: string }`
  - Returns: `string` — HTML script tag to track a blog post view event

#### Event payload

- Includes stable identifiers for the post (`post_id`, `post_slug`) and agent (`agent_id`).
- May include optional metadata such as `post_title`.
- Includes event classification fields and a timestamp.
- Note: Exact keys may evolve; check release notes for changes.

## Types

- ContentList
  - posts: Array of summary objects:
    - `id`: string
    - `meta`: { title?: string; description?: string; keywords?: string[]; slug?: string; sources?: string[] }
    - `imageUrl`: string | null
    - `status`: "draft" | "approved"
    - `stats`: { wordsCount?: string; readTimeMinutes?: string; qualityScore?: string }
    - `createdAt`: Date
  - total: number

- ContentSelect
  - `id`: string
  - `agentId`: string
  - `imageUrl`: string | null
  - `body`: string
  - `status`: "draft" | "approved"
  - `meta`: { title?: string; description?: string; keywords?: string[]; slug?: string; sources?: string[] }
  - `request`: { description: string }
  - `stats`: { wordsCount?: string; readTimeMinutes?: string; qualityScore?: string }
  - `createdAt`: Date
  - `updatedAt`: Date

- AuthorByAgentId
  - `name`: string
  - `profilePhoto`: { image: string; contentType: string } | null

- RelatedSlugsResponse
  - Array of strings (slugs)

## Error Codes
- `SDK_E001`: apiKey is required to initialize the ContentaGenSDK
- `SDK_E002`: API request failed
- `SDK_E003`: Invalid API response format
- `SDK_E004`: Invalid input

## Example with Error Handling

```ts
async function run() {
  try {
    const sdk = createSdk({ apiKey: process.env.CONTENTAGEN_API_KEY! });

    const list = await sdk.listContentByAgent({
      agentId: ["00000000-0000-0000-0000-000000000000"],
      status: ["approved"],
      limit: 5,
      page: 1,
    });

    if (list.total === 0) {
      console.log("No posts found");
      return;
    }

    const first = list.posts[0];
    console.log("First post id:", first.id);

    const post = await sdk.getContentBySlug({
      slug: first.meta.slug ?? "unknown-slug",
      agentId: first.agentId || "00000000-0000-0000-0000-000000000000",
    });

    console.log("Post body:", post.body);
  } catch (err) {
    console.error("SDK error:", err);
  }
}
```

## PostHog Analytics Example

```ts
import { createSdk, createPostHogHelper } from "@contentagen/sdk";

const sdk = createSdk({ apiKey: "YOUR_API_KEY" });

const posthogHelper = createPostHogHelper();

// Example usage in AstroJS or other build-time frameworks
async function renderBlogPost(slug: string, agentId: string) {
  // Get post data
  const post = await sdk.getContentBySlug({ slug, agentId });

  // Generate tracking script for blog post view
  const trackViewScript = posthogHelper.trackBlogPostView({
    id: post.id,
    slug: post.meta.slug || slug,
    title: post.meta.title,
    agentId: post.agentId,
  });

  // In AstroJS, inject the tracking script into the page
  return {
    trackingScript: trackViewScript,
    post,
  };
}
```

## Changelog
See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

## License
Apache License 2.0

## Star History

<a href="https://www.star-history.com/#code-weavers/contentagen-sdk&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=code-weavers/contentagen-sdk&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=code-weavers/contentagen-sdk&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=code-weavers/contentagen-sdk&type=Date" />
 </picture>
</a>


