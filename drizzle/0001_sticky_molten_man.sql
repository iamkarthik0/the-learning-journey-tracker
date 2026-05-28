CREATE TABLE `students` (
	`student_id` text PRIMARY KEY NOT NULL,
	`roll_number` integer NOT NULL,
	`full_name` text NOT NULL,
	`sourced_id` text,
	`grade_level` text,
	`section` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
