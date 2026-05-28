-- Add columns with nullable first
ALTER TABLE `student_attendance` ADD `attendance_date` text;
ALTER TABLE `student_attendance` ADD `created_at` text;

-- Update existing rows to have today's date
UPDATE `student_attendance` SET `attendance_date` = date('now'), `created_at` = datetime('now') WHERE `attendance_date` IS NULL;