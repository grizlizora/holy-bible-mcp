CREATE TABLE `mcp_servers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`command` text NOT NULL,
	`args` text NOT NULL,
	`env` text DEFAULT '{}' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mcp_name_idx` ON `mcp_servers` (`name`);--> statement-breakpoint
CREATE INDEX `mcp_active_idx` ON `mcp_servers` (`is_active`);--> statement-breakpoint
CREATE INDEX `mcp_created_idx` ON `mcp_servers` (`created_at`);--> statement-breakpoint
ALTER TABLE `attachments` ADD `extracted_text` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `metadata` text;