# ContentaGen SDK

Official TypeScript SDK for interacting with the ContentaGen API.

Features
- Lightweight client.
- Input validation with Zod schemas.
- Automatic date parsing for `createdAt` / `updatedAt`.
- Small, consistent error code surface.

## Installation

npm:
```bash
npm install @contentagen/sdk
```

yarn:
```bash
yarn add @contentagen/sdk
```

## Quick start (TypeScript)

```ts
import { createSdk } from "@contentagen/sdk";
import type { ContentList, ContentSelect } from "@contentagen/sdk";

const sdk = createSdk({ apiKey: "YOUR_API_KEY" });

async function example() {
  // List content by agent
  const listParams = {
    agentId: ["00000000-0000-0000-0000-000000000000"], // UUIDs
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
}
```

## API

Exports
- `createSdk(config: { apiKey: string }): ContentaGenSDK` — factory that returns a new SDK instance.
- `ContentaGenSDK` class — same methods available on instances.
- Zod schemas re-exported for advanced usage:
  - `ContentListResponseSchema`
  - `ContentSelectSchema`
  - `GetContentBySlugInputSchema`
  - `ListContentByAgentInputSchema`

### Methods

- `sdk.listContentByAgent(params)`
  - params (validated by `ListContentByAgentInputSchema`):
    - `agentId`: string[] (UUIDs) — required
    - `status`: ("draft" | "approved" )[] — required
    - `limit?: number` — optional, default 10, between 1 and 100
    - `page?: number` — optional, default 1, min 1
  - Returns: `Promise<ContentList>`

- `sdk.getContentBySlug(params)`
  - params (validated by `GetContentBySlugInputSchema`):
    - `slug`: string — required
    - `agentId`: string (UUID) — required
  - Returns: `Promise<ContentSelect>`

## Types (shapes)

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

## Error codes
- `SDK_E001`: apiKey is required to initialize the ContentaGenSDK
- `SDK_E002`: API request failed
- `SDK_E003`: Invalid API response format.
- `SDK_E004`: Invalid input.

## Example with error handling

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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

## License

Apache License 2.0
