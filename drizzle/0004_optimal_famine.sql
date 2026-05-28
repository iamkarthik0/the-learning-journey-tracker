CREATE TABLE `subjects` (
	`subject_id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`subject_name` text NOT NULL,
	`sourced_id` text,
	`grade_level` text,
	`color_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`teacher_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`teacher_id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'teacher',
	`sourced_id` text,
	`specialization` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_email_unique` ON `teachers` (`email`);