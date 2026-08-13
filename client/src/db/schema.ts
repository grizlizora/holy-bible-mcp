import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON string snapshot of settings
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const notebooks = sqliteTable('notebooks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  messageId: text('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  notebookId: text('notebook_id').references(() => notebooks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image', 'file', 'table'
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  size: integer('size'),
  extractedText: text('extracted_text'), // Hidden context injected into the prompt
});
