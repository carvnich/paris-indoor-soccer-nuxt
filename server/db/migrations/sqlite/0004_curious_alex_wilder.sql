CREATE TABLE `leagues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`playoff_format` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leagues_slug_unique` ON `leagues` (`slug`);--> statement-breakpoint
DROP INDEX `seasons_name_unique`;--> statement-breakpoint
ALTER TABLE `seasons` ADD `league_id` integer NOT NULL REFERENCES leagues(id);--> statement-breakpoint
CREATE UNIQUE INDEX `seasons_leagueId_name_unique` ON `seasons` (`league_id`,`name`);