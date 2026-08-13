import { BibleMcpClient } from './src/lib/mcp/mcp-client';
async function run() {
  const c = new BibleMcpClient();
  await c.connect();
  const t = c.getTools().find(t => t.name === 'ask_holy_bible');
  console.log(JSON.stringify(t?.inputSchema, null, 2));
  process.exit(0);
}
run();
