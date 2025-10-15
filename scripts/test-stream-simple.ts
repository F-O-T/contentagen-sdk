#!/usr/bin/env bun

/**
 * Simple streaming test - just set your question and run
 */

import { createSdk } from "../src/index.js";

// 🔧 SET YOUR QUESTION HERE
const question = "o que e o robo de lances";

// 🔧 SET YOUR API CREDENTIALS (or use environment variables)
const API_KEY = process.env.CONTENTAGEN_API_KEY || "your-api-key-here";
const AGENT_ID = process.env.CONTENTAGEN_AGENT_ID || "your-agent-id-here";

// Create SDK instance
const sdk = createSdk({
	apiKey: API_KEY,
	locale: "pt",
	host: "http://localhost:9876", // or your custom host
});

async function testStreaming(): Promise<void> {
	console.log("🎯 Streaming Test");
	console.log("─".repeat(50));
	console.log(`📝 Question: ${question}`);
	console.log(`🔗 Host: http://localhost:9876`);
	console.log(`🤖 Agent ID: ${AGENT_ID}`);
	console.log("🤖 Response:");
	console.log("");

	const startTime = Date.now();

	try {
		console.log("🔄 Starting stream...");
		const stream = sdk.streamAssistantResponse({
			message: question,
			agentId: AGENT_ID,
		});

		console.log("✅ Stream created, reading response...");
		let response = "";
		let chunkCount = 0;

		for await (const chunk of stream) {
			chunkCount++;
			process.stdout.write(chunk);
			response += chunk;
		}

		const duration = Date.now() - startTime;
		console.log(`\n${"─".repeat(50)}`);
		console.log(
			`✅ Done! ${response.length} chars in ${chunkCount} chunks, ${duration}ms`,
		);
	} catch (error) {
		console.error(
			"❌ Error:",
			error instanceof Error ? error.message : String(error),
		);

		// Additional debugging info
		if (error instanceof Error) {
			console.error("🔍 Debug info:");
			console.error("   Error name:", error.name);
			console.error("   Error code:", (error as any).code);
			console.error("   Error errno:", (error as any).errno);
		}

		// Troubleshooting tips
		console.log("\n💡 Troubleshooting:");
		console.log(
			"   1. Make sure your local server is running on http://localhost:9876",
		);
		console.log("   2. Check if the server supports streaming (SSE)");
		console.log("   3. Verify the agent ID is correct");
		console.log("   4. Try with the production API (remove host option)");
	}
}

testStreaming();
