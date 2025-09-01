import { beforeEach, describe, expect, it } from "vitest";
import { createPostHogHelper } from "../src/posthog";

describe("PostHogHelper", () => {
	describe("trackBlogPostView", () => {
		let helper: ReturnType<typeof createPostHogHelper>;

		beforeEach(() => {
			helper = createPostHogHelper();
		});

		it("generates tracking script with all required fields", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain("<script>");
			expect(script).toContain("</script>");
			expect(script).toContain("typeof posthog !== 'undefined'");
			expect(script).toContain("posthog.capture");
			expect(script).toContain("blog_post_view");
			expect(script).toContain('"post_id":"post-123"');
			expect(script).toContain('"post_slug":"my-awesome-post"');
			expect(script).toContain('"post_title":"My Awesome Post"');
			expect(script).toContain('"agent_id":"agent-456"');
			expect(script).toContain('"event_type":"blog_post_view"');
			expect(script).toContain('"timestamp"');
			// Verify JSON is properly escaped
			expect(script).toContain("posthog.capture('blog_post_view', {");
		});

		it("handles post without title", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain('"post_title":"Untitled"');
		});

		it("includes timestamp in ISO format", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			// Check that timestamp is in ISO format (contains T and Z or +/- timezone)
			const scriptContent = script
				.replace("<script>", "")
				.replace("</script>", "");
			const captureCall = scriptContent.match(
				/posthog\.capture\('blog_post_view', (\{.*\})\)/,
			);
			expect(captureCall).toBeTruthy();

			const eventData = JSON.parse(captureCall?.[1] || "{}");
			expect(eventData.timestamp).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
		});

		it("generates valid escaped JSON in the script", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			// Extract the JSON from the script
			const scriptContent = script
				.replace("<script>", "")
				.replace("</script>", "");
			const captureCall = scriptContent.match(
				/posthog\.capture\('blog_post_view', (\{.*\})\)/,
			);
			expect(captureCall).toBeTruthy();

			// Should not throw when parsing the escaped JSON
			const escapedJson = captureCall?.[1] || "{}";
			expect(() => JSON.parse(escapedJson)).not.toThrow();

			// Verify the JSON contains expected structure
			const parsed = JSON.parse(escapedJson);
			expect(parsed).toHaveProperty("post_id", "post-123");
			expect(parsed).toHaveProperty("post_slug", "my-awesome-post");
			expect(parsed).toHaveProperty("post_title", "My Awesome Post");
			expect(parsed).toHaveProperty("agent_id", "agent-456");
			expect(parsed).toHaveProperty("event_type", "blog_post_view");
			expect(parsed).toHaveProperty("timestamp");
		});

		it("handles special characters in title", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My \"Awesome\" Post with 'quotes' and <tags>",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain(
				'"post_title":"My \\"Awesome\\" Post with \'quotes\' and \\u003Ctags\\u003E"',
			);
		});

		it("handles special characters in slug", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post-with-特殊字符",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain('"post_slug":"my-awesome-post-with-特殊字符"');
		});

		it("works with different post IDs and agent IDs", () => {
			const testCases = [
				{
					id: "uuid-123",
					slug: "test-post-1",
					title: "Test Post 1",
					agentId: "agent-uuid-1",
				},
				{
					id: "simple-id",
					slug: "another-test",
					title: "Another Test",
					agentId: "different-agent",
				},
			];

			testCases.forEach((postData) => {
				const script = helper.trackBlogPostView(postData);
				expect(script).toContain(`"post_id":"${postData.id}"`);
				expect(script).toContain(`"post_slug":"${postData.slug}"`);
				expect(script).toContain(`"post_title":"${postData.title}"`);
				expect(script).toContain(`"agent_id":"${postData.agentId}"`);
			});
		});

		it("returns a string that can be safely injected into HTML", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			// Should be a valid HTML script tag
			expect(script).toMatch(/^<script>/);
			expect(script).toMatch(/<\/script>$/);

			// Should not contain unescaped HTML characters that could break the script
			expect(script).not.toMatch(/<script[^>]*<script/);
			expect(script).not.toMatch(/<\/script[^>]*<\/script/);
		});
	});
});
