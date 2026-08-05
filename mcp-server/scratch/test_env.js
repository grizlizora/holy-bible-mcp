import { spawn } from 'child_process';

async function testMcpWithEnv(latencyScore, responseMode, testQuery) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['/Users/roman/Projects/holy/mcp-server/build/index.js'], {
            env: {
                ...process.env,
                DEFAULT_LATENCY_SCORE: latencyScore,
                DEFAULT_RESPONSE_MODE: responseMode
            }
        });

        let output = '';
        child.stdout.on('data', (chunk) => {
            output += chunk.toString();
        });

        // Send JSON-RPC initialize + callTool request
        const initReq = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "test-client", version: "1.0.0" }
            }
        }) + "\n";

        const initializedNotification = JSON.stringify({
            jsonrpc: "2.0",
            method: "notifications/initialized"
        }) + "\n";

        const toolReq = JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "search_keyword",
                arguments: { query: "любов", language: "ukr" }
            }
        }) + "\n";

        child.stdin.write(initReq);
        child.stdin.write(initializedNotification);
        child.stdin.write(toolReq);

        setTimeout(() => {
            child.kill();
            resolve(output);
        }, 1500);
    });
}

async function runAudit() {
    console.log("=== TEST 1: DEFAULT_LATENCY_SCORE=80, DEFAULT_RESPONSE_MODE=auto ===");
    const out1 = await testMcpWithEnv("80", "auto", "любов");
    console.log(out1);

    console.log("\n=== TEST 2: DEFAULT_LATENCY_SCORE=10, DEFAULT_RESPONSE_MODE=minimal ===");
    const out2 = await testMcpWithEnv("10", "minimal", "любов");
    console.log(out2);
}

runAudit();
