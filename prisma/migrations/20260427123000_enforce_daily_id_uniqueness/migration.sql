CREATE INDEX IF NOT EXISTS "analyses_dailyId_creationDate_idx" ON "analyses"("dailyId", "creationDate");

DROP TRIGGER IF EXISTS "analyses_daily_id_unique_per_day_insert";
CREATE TRIGGER "analyses_daily_id_unique_per_day_insert"
BEFORE INSERT ON "analyses"
FOR EACH ROW
WHEN NEW."dailyId" IS NOT NULL AND trim(NEW."dailyId") <> ''
BEGIN
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM "analyses"
        WHERE "dailyId" IS NOT NULL
          AND upper(trim("dailyId")) = upper(trim(NEW."dailyId"))
          AND date("creationDate", 'localtime') = date(COALESCE(NEW."creationDate", CURRENT_TIMESTAMP), 'localtime')
      )
      THEN RAISE(ABORT, 'DUPLICATE_DAILY_ID_FOR_DAY')
    END;
END;

DROP TRIGGER IF EXISTS "analyses_daily_id_unique_per_day_update";
CREATE TRIGGER "analyses_daily_id_unique_per_day_update"
BEFORE UPDATE OF "dailyId", "creationDate" ON "analyses"
FOR EACH ROW
WHEN NEW."dailyId" IS NOT NULL AND trim(NEW."dailyId") <> ''
BEGIN
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM "analyses"
        WHERE "id" <> OLD."id"
          AND "dailyId" IS NOT NULL
          AND upper(trim("dailyId")) = upper(trim(NEW."dailyId"))
          AND date("creationDate", 'localtime') = date(COALESCE(NEW."creationDate", OLD."creationDate", CURRENT_TIMESTAMP), 'localtime')
      )
      THEN RAISE(ABORT, 'DUPLICATE_DAILY_ID_FOR_DAY')
    END;
END;
