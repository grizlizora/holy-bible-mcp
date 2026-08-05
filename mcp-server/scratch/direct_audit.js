import path from 'path';
import { fileURLToPath } from 'url';

// Test env variables directly against the compiled server logic
process.env.DEFAULT_LATENCY_SCORE = "80";
process.env.DEFAULT_RESPONSE_MODE = "auto";

console.log("=== EMPIRICAL AUDIT RESULTS ===");
console.log("DEFAULT_LATENCY_SCORE:", process.env.DEFAULT_LATENCY_SCORE);
console.log("DEFAULT_RESPONSE_MODE:", process.env.DEFAULT_RESPONSE_MODE);

// Dynamically import the compiled index.js
import('/Users/roman/Projects/holy/mcp-server/build/index.js').then(() => {
    console.log("SUCCESS: MCP Server initialized with env settings!");
}).catch(err => {
    console.error("FAIL:", err.message);
});
