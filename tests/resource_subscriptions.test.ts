import { describe, it, expect } from "vitest";
import { ResourcePoolManager } from "../src/resources_repository.js";
import { createServerInstance } from "../src/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

describe("Resource Subscriptions Subsystem", () => {
  it("should track subscription and unsubscription in ResourcePoolManager", () => {
    const testUri = "bible://ubio/JHN/3";

    expect(ResourcePoolManager.isSubscribed(testUri)).toBe(false);

    ResourcePoolManager.subscribe(testUri);
    expect(ResourcePoolManager.isSubscribed(testUri)).toBe(true);
    expect(ResourcePoolManager.getSubscribedUris()).toContain(testUri);

    ResourcePoolManager.unsubscribe(testUri);
    expect(ResourcePoolManager.isSubscribed(testUri)).toBe(false);
  });

  it("should handle MCP protocol resources/subscribe and resources/unsubscribe requests", async () => {
    const server = createServerInstance();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    const client = new Client(
      { name: "test-client", version: "1.0.0" },
      { capabilities: {} }
    );
    await client.connect(clientTransport);

    const testUri = "bible://kjv/PSA/23";
    await client.subscribeResource({ uri: testUri });
    expect(ResourcePoolManager.isSubscribed(testUri)).toBe(true);

    await client.unsubscribeResource({ uri: testUri });
    expect(ResourcePoolManager.isSubscribed(testUri)).toBe(false);

    await client.close();
    await server.close();
  });
});
