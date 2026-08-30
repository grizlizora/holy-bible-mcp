import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServerInstance } from "../../src/index.js";
import { DirectiveStore } from "../../src/directives/directive_store.js";

describe("E2E: MCP JSON-RPC Client Session (Claude Desktop & Cursor Simulation)", () => {
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    await DirectiveStore.getInstance().loadDirectives();
    const server = createServerInstance();

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client(
      { name: "claude-desktop-test-client", version: "2.0.0" },
      { capabilities: { roots: {}, sampling: {} } }
    );

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport)
    ]);
  });

  afterAll(async () => {
    await client.close();
  });

  it("1. should perform full MCP protocol handshake and capability negotiation", async () => {
    const serverVersion = client.getServerVersion();
    expect(serverVersion?.name).toBe("holy-bible-mcp");
    expect(serverVersion?.version).toBe("2.0.0");
  });

  it("2. should discover all 28 registered tools via tools/list", async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBe(28);
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("ask_holy_bible");
    expect(toolNames).toContain("get_verse");
    expect(toolNames).toContain("search_keyword");
    expect(toolNames).toContain("get_strongs_definition");
    expect(toolNames).toContain("get_cross_references");
    expect(toolNames).toContain("get_interlinear_verse");
    expect(toolNames).toContain("get_mcp_capabilities");
    expect(toolNames).toContain("get_p2p_swarm_status");
  });

  it("3. should discover all 4 canonical resource templates via resources/templates/list", async () => {
    const res = await client.listResourceTemplates();
    expect(res.resourceTemplates.length).toBe(4);
    const uris = res.resourceTemplates.map((r) => r.uriTemplate);
    expect(uris).toContain("bible://{translation}/{book}/{chapter}");
    expect(uris).toContain("bible://strongs/{strongsId}");
    expect(uris).toContain("bible://crossref/{book}/{chapter}/{verse}");
    expect(uris).toContain("bible://interlinear/{book}/{chapter}/{verse}");
  });

  it("4. should execute ask_holy_bible tool with Ukrainian existential inquiry", async () => {
    const result = await client.callTool({
      name: "ask_holy_bible",
      arguments: {
        question: "Що Біблія говорить про любов?",
        language: "ukr",
        warmth: 85,
        mode: "detailed"
      }
    });

    expect(result.isError).toBeFalsy();
    const textContent = (result.content as any)[0]?.text;
    expect(textContent).toBeDefined();
    const data = JSON.parse(textContent);
    expect(data.contextText).toBeDefined();
    expect(data.contextText).toMatch(/(?:1JOHN|1 Івана|1COR|1 Коринфянам)/i);
    expect(data.sensitivityProfile?.levelId).toBe("deep_love");
    expect(data.accuracyScore).toBeDefined();
    expect(Array.isArray(data.verses)).toBe(true);
  });


  it("5. should execute get_verse tool with formatted citation output", async () => {
    const result = await client.callTool({
      name: "get_verse",
      arguments: {
        reference: "John 3:16",
        language: "eng"
      }
    });

    expect(result.isError).toBeFalsy();
    const text = (result.content as any)[0]?.text;
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  });

  it("6. should execute search_keyword tool with translation filter", async () => {
    const result = await client.callTool({
      name: "search_keyword",
      arguments: {
        keyword: "любов",
        language: "ukr",
        limit: 3
      }
    });

    expect(result.isError).toBeFalsy();
    const text = (result.content as any)[0]?.text;
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  });

  it("7. should list and hydrate MCP Prompt templates (prompts/list & prompts/get)", async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts.length).toBeGreaterThanOrEqual(5);

    const hydrated = await client.getPrompt({
      name: "theological_exegesis",
      arguments: {
        topic_or_verse: "Romans 8:28",
        language: "eng",
        depth: "scholarly"
      }
    });

    const promptText = (hydrated.messages[0]?.content as any)?.text;
    expect(promptText).toBeDefined();
    expect(promptText).toContain("[ROLE & CONTEXT: THEOLOGICAL EXEGESIS ENGINE]");
    expect(promptText).toContain("Target Passage / Doctrine: \"Romans 8:28\"");
  });

  it("8. should read canonical Strong's and Chapter resources (resources/read)", async () => {
    const strongsResource = await client.readResource({ uri: "bible://strongs/G26" });
    expect(strongsResource.contents[0]?.mimeType).toBe("application/json");
    const strongsData = JSON.parse(strongsResource.contents[0]?.text as string);
    expect(strongsData.lemma).toBe("ἀγάπη");
    expect(strongsData.strongsId).toBe("G0026");

    const chapterResource = await client.readResource({ uri: "bible://ubio/GEN/1" });
    expect(chapterResource.contents[0]?.mimeType).toBe("text/markdown");
    expect(chapterResource.contents[0]?.text).toContain("Буття 1");
  });

  it("9. should query get_p2p_swarm_status and receive active storage telemetry", async () => {
    const result = await client.callTool({
      name: "get_p2p_swarm_status",
      arguments: {}
    });

    expect(result.isError).toBeFalsy();
    const data = JSON.parse((result.content as any)[0]?.text);
    expect(data.server).toBe("holy-bible-mcp");
    expect(data.protocol).toContain("WebTorrent / BitTorrent");
    expect(data.storagePath).toBeDefined();
  });
});
