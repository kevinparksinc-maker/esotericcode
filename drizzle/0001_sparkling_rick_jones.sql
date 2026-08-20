CREATE TABLE `readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`repositoryUrl` varchar(512) NOT NULL,
	`repositoryOwner` varchar(128) NOT NULL,
	`repositoryName` varchar(256) NOT NULL,
	`shareSlug` varchar(24) NOT NULL,
	`isShared` boolean NOT NULL DEFAULT false,
	`metrics` json NOT NULL,
	`tarot` json NOT NULL,
	`iching` json NOT NULL,
	`narrative` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `readings_shareSlug_unique` UNIQUE(`shareSlug`)
);
--> statement-breakpoint
ALTER TABLE `readings` ADD CONSTRAINT `readings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;