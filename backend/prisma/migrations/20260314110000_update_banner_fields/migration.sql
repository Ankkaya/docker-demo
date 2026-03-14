ALTER TABLE "Banner"
RENAME COLUMN "name" TO "title";

ALTER TABLE "Banner"
ADD COLUMN "tag" TEXT,
ADD COLUMN "subtitle" TEXT;
