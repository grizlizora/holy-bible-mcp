"use server";

import { db } from '@/db';
import { chats, messages, attachments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function createChat(title: string) {
  const newChat = {
    id: uuidv4(),
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: false,
  };
  
  await db.insert(chats).values(newChat);
  return newChat;
}

export async function getChats() {
  return await db.select().from(chats).orderBy(desc(chats.isPinned), desc(chats.updatedAt));
}

export async function togglePinChat(id: string, isPinned: boolean) {
  await db.update(chats)
    .set({ isPinned, updatedAt: new Date() })
    .where(eq(chats.id, id));
  return true;
}

import fs from 'fs';
import path from 'path';

export async function deleteChat(id: string) {
  try {
    // 1. Find all physical attachment files for this chat
    const chatMsgs = await db.select({ id: messages.id }).from(messages).where(eq(messages.chatId, id));
    const msgIds = chatMsgs.map((m: any) => m.id);
    
    if (msgIds.length > 0) {
      const { attachments } = await import('@/db/schema');
      const chatAtts = await db.select().from(attachments).where(inArray(attachments.messageId, msgIds));
      
      for (const att of chatAtts) {
        if (att.url && att.url.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', att.url);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
      }
    }

    // 2. Cascade delete messages & chat from SQLite
    await db.delete(chats).where(eq(chats.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return { success: false, error: "Failed to delete chat" };
  }
}

export async function addMessage(
  chatId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: any,
  attachedFiles?: any[],
  customId?: string
) {
  const messageId = customId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = new Date();

  db.transaction((tx) => {
    // 1. Insert message
    tx.insert(messages).values({
      id: messageId,
      chatId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt,
    }).run();

    // 2. Batch insert attachments if present
    if (attachedFiles && attachedFiles.length > 0) {
      const attachmentRows = attachedFiles.map((file: any) => ({
        id: file.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        messageId: messageId,
        type: file.type || 'file',
        url: file.url || '',
        filename: file.filename || file.name || 'file',
        size: file.size || 0,
        extractedText: file.extractedText || null,
      }));

      tx.insert(attachments).values(attachmentRows).run();
    }

    // 3. Update chat updatedAt timestamp in the same transaction lock
    tx.update(chats).set({ updatedAt: createdAt }).where(eq(chats.id, chatId)).run();
  });

  return { id: messageId, chatId, role, content, metadata, createdAt, attachments: attachedFiles || [] };
}

import { inArray } from 'drizzle-orm';

export async function getMessages(chatId: string) {
  const msgs = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  if (msgs.length === 0) return [];

  const msgIds = msgs.map((m: any) => m.id);
  const { attachments } = await import('@/db/schema');
  const atts = await db.select().from(attachments).where(inArray(attachments.messageId, msgIds));

  // Map attachments using O(N+M) Hash Map lookup
  const attMap = new Map<string, typeof atts>();
  for (const att of atts) {
    if (!att.messageId) continue;
    let list = attMap.get(att.messageId);
    if (!list) {
      list = [];
      attMap.set(att.messageId, list);
    }
    list.push(att);
  }

  return msgs.map((msg: any) => ({
    ...msg,
    attachments: attMap.get(msg.id) || [],
  }));
}

export async function rollbackChatToMessage(chatId: string, messageId: string) {
  const targetMsg = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (targetMsg.length === 0) return false;

  const targetTime = targetMsg[0].createdAt;

  // Delete target user message AND all subsequent messages created at or after timestamp
  const { gte, and } = await import('drizzle-orm');
  await db.delete(messages)
    .where(and(
      eq(messages.chatId, chatId),
      gte(messages.createdAt, targetTime)
    ));

  return true;
}

export async function getOllamaModels() {
  try {
    const rawBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const tagsUrl = baseUrl.endsWith('/api') ? `${baseUrl}/tags` : `${baseUrl}/api/tags`;

    const res = await fetch(tagsUrl, {
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.models.map((m: any) => m.name);
  } catch (e) {
    // Modern fallback list including Qwen 3.5, Gemma 4, DeepSeek R1, Llama 3.3
    return ['qwen3.5:14b', 'qwen2.5:14b', 'gemma4:9b', 'deepseek-r1:14b', 'llama3.3:70b']; 
  }
}

export async function searchChatsGlobal(query: string) {
  if (!query || query.trim().length === 0) return [];
  
  // Strip FTS5 operators and special symbols to prevent syntax errors
  const cleaned = query.replace(/[:*^()\{}\[\]~"'-]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];
  
  // Wrap each word in quotes and append '*' for prefix matching, join with AND
  const ftsQuery = words.map(w => `"${w}"*`).join(' AND ');

  try {
    const { sqlite } = await import('@/db');
    
    // Use snippet() to get surrounding context.
    // Rank is BM25 scoring for relevance.
    const stmt = sqlite.prepare(`
      SELECT 
        c.id as chatId,
        c.title as chatTitle,
        c.updated_at as updatedAt,
        m.id as messageId,
        m.created_at as messageTime,
        snippet(messages_fts, -1, '[[[MATCH]]]', '[[[/MATCH]]]', '...', 15) as snippet,
        rank
      FROM messages_fts fts
      JOIN messages m ON fts.rowid = m.rowid
      JOIN chats c ON fts.chat_id = c.id
      WHERE messages_fts MATCH ?
      ORDER BY rank
      LIMIT 100
    `);

    const rawResults = stmt.all(ftsQuery) as any[];

    // Group by chatId to only show one best match per chat
    const uniqueChats = new Map<string, any>();
    for (const r of rawResults) {
      if (!uniqueChats.has(r.chatId)) {
        uniqueChats.set(r.chatId, r);
      } else {
        // FTS5 rank is more negative for better matches.
        // Keep the one with the better rank (more negative).
        const existing = uniqueChats.get(r.chatId);
        if (r.rank < existing.rank) {
          uniqueChats.set(r.chatId, r);
        }
      }
    }
    
    const results = Array.from(uniqueChats.values()).map(r => ({
      chatId: r.chatId,
      chatTitle: r.chatTitle,
      messageId: r.messageId,
      messageTime: r.messageTime,
      snippet: r.snippet,
      updatedAt: r.updatedAt,
      rank: r.rank
    }));
    
    // Sort by recent chat usage first
    results.sort((a, b) => b.updatedAt - a.updatedAt);

    // Return top 20 unique chats
    return results.slice(0, 20);

  } catch (e) {
    console.error("Search failed:", e);
    return [];
  }
}
