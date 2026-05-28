PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_student_attendance` (
	`attendance_id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'present',
	`subject_status` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_student_attendance`("attendance_id", "student_id", "status", "subject_status", "updated_at") SELECT "attendance_id", "student_id", "status", "subject_status", "updated_at" FROM `student_attendance`;--> statement-breakpoint
DROP TABLE `student_attendance`;--> statement-breakpoint
ALTER TABLE `__new_student_attendance` RENAME TO `student_attendance`;--> statement-breakpoint
PRAGMA foreign_keys=ON;