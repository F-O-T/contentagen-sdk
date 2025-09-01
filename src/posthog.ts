/**
 * PostHog Analytics Helper for Blog Post Tracking
 * Generates tracking code for blog post views in build-time frameworks like AstroJS
 */
export class PostHogHelper {
	trackBlogPostView(postData: {
		id: string;
		slug: string;
		title?: string;
		agentId: string;
	}): string {
		const eventData = {
			post_id: postData.id,
			post_slug: postData.slug,
			post_title: postData.title || "Untitled",
			agent_id: postData.agentId,
			event_type: "blog_post_view",
			timestamp: new Date().toISOString(),
		};

		return `<script>
  if (typeof posthog !== 'undefined') {
    posthog.capture('blog_post_view', ${JSON.stringify(eventData)});
  }
</script>`;
	}
}

export const createPostHogHelper = (): PostHogHelper => {
	return new PostHogHelper();
};
