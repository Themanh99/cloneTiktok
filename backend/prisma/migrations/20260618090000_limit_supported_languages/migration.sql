UPDATE "users"
SET "languageId" = NULL
WHERE "languageId" IN (
  SELECT "id" FROM "languages" WHERE "code" NOT IN ('vi', 'en')
);

DELETE FROM "languages" WHERE "code" NOT IN ('vi', 'en');

INSERT INTO "languages" ("code", "name", "isActive")
VALUES ('vi', 'Vietnamese', true), ('en', 'English', true)
ON CONFLICT ("code") DO UPDATE SET "isActive" = true;

INSERT INTO "system_settings" ("key", "value", "description", "updatedAt")
VALUES
  ('default_language', 'vi', 'Default application language', CURRENT_TIMESTAMP),
  ('supported_languages', '["vi","en"]', 'Languages enabled for the application', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "value" = EXCLUDED."value",
    "description" = EXCLUDED."description",
    "updatedAt" = CURRENT_TIMESTAMP;
