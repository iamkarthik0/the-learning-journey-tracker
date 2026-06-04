CREATE TABLE `chapters` (
	`chapter_id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`chapter_name` text NOT NULL,
	`start_date` text DEFAULT CURRENT_DATE,
	`end_date` text,
	`is_completed` integer DEFAULT false,
	`order_index` integer,
	`ai_context_key` text,
	`questions` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON UPDATE no action ON DELETE no action
);
