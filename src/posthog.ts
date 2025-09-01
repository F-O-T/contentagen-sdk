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

		const payloadJson = JSON.stringify(eventData)
			.replace(/</g, "\\u003C")
			.replace(/>/g, "\\u003E")
			.replace(/&/g, "\\u0026")
			.replace(/\u2028/g, "\\u2028")
			.replace(/\u2029/g, "\\u2029");

		return `<script>
  if (typeof posthog !== 'undefined') {
    posthog.capture('blog_post_view', ${payloadJson});
  }
</script>`;
	}
}

export const createPostHogHelper = (): PostHogHelper => {
	return new PostHogHelper();
};
