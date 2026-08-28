CREATE TABLE `githubConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubLogin` varchar(255) NOT NULL,
	`accessTokenEncrypted` text NOT NULL,
	`scope` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `githubConnections_id` PRIMARY KEY(`id`),
	CONSTRAINT `githubConnections_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `githubOAuthStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`state` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `githubOAuthStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `githubOAuthStates_state_unique` UNIQUE(`state`)
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`repositoryUrl` varchar(512) NOT NULL,
	`repositoryOwner` varchar(128) NOT NULL,
	`repositoryName` varchar(256) NOT NULL,
	`shareSlug` varchar(24) NOT NULL,
	`isShared` boolean NOT NULL DEFAULT false,
	`metrics` json NOT NULL,
	`architecture` json NOT NULL,
	`tarot` json NOT NULL,
	`iching` json NOT NULL,
	`kpChart` json NOT NULL,
	`actions` json NOT NULL,
	`narrative` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `readings_shareSlug_unique` UNIQUE(`shareSlug`)
);
--> statement-breakpoint
ALTER TABLE `githubConnections` ADD CONSTRAINT `githubConnections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `githubOAuthStates` ADD CONSTRAINT `githubOAuthStates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `readings` ADD CONSTRAINT `readings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;