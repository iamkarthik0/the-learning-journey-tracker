CREATE TABLE `attendance_sessions` (
	`session_id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`session_date` text DEFAULT CURRENT_DATE,
	`period_number` integer NOT NULL,
	`is_completed` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`attendance_id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'present',
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions`(`session_id`) ON UPDATE no action ON DELETE no action
);
