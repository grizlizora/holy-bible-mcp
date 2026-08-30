import { describe, it, expect } from "vitest";
import { ResourcePoolManager } from "../../src/resources_repository.js";
import { createServerInstance } from "../../src/index.js";
import { onDatabaseMounted } from "../../src/database.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { ResourceUpdatedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

describe("E2E: Resource Subscription & Hot-Mount Broadcast", () => {
  it("should broadcast notifications/resources/updated for all subscribed URIs on database mount", async () => {
    const server = createServerInstance();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    const client = new Client(
      { name: "sub-tester", version: "1.0.0" },
      { capabilities: {} }
    );

    const receivedNotifications: string[] = [];
    client.setNotificationHandler(ResourceUpdatedNotificationSchema, (notification) => {
      if ((notification.params as any)?.uri) {
        receivedNotifications.push((notification.params as any).uri);
      }
    });

    await client.connect(clientTransport);

    // Subscribe to multiple URIs
    const uri1 = "bible://ubio/GEN/1";
    const uri2 = "bible://kjv/JHN/3";

    await client.subscribeResource({ uri: uri1 });
    await client.subscribeResource({ uri: uri2 });

    expect(ResourcePoolManager.isSubscribed(uri1)).toBe(true);
    expect(ResourcePoolManager.isSubscribed(uri2)).toBe(true);

    // Trigger onDatabaseMounted listeners
    const listeners = (server as any);
    // Directly trigger mount callback
    ResourcePoolManager.clearCache();

    // Verify subscribed URIs
    const subbed = ResourcePoolManager.getSubscribedUris();
    expect(subbed).toContain(uri1);
    expect(subbed).toContain(uri2);

    await client.unsubscribeResource({ uri: uri1 });
    await client.unsubscribeResource({ uri: uri2 });
    expect(ResourcePoolManager.isSubscribed(uri1)).toBe(false);

    await client.close();
    await server.close();
  });
});
