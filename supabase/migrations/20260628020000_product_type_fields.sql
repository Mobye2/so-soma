-- ebook 欄位
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ebook_download_url  text,
  ADD COLUMN IF NOT EXISTS ebook_file_format   text;

-- event 欄位
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS event_datetime      text,
  ADD COLUMN IF NOT EXISTS event_location      text,
  ADD COLUMN IF NOT EXISTS event_meeting_notes text,
  ADD COLUMN IF NOT EXISTS event_notes         text;

-- live_class 額外欄位
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS live_stream_url     text,
  ADD COLUMN IF NOT EXISTS live_time_notes     text;

-- 廢棄 product_deliverables（保留資料表但不再使用，待確認後再 DROP）
-- DROP TABLE IF EXISTS product_deliverables;
