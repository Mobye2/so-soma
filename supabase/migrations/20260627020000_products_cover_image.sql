-- products 加 cover_image 欄位
ALTER TABLE products ADD COLUMN IF NOT EXISTS cover_image text;

-- 把現有課程封面複製過來
UPDATE products p
SET cover_image = c.cover_image
FROM courses c
WHERE c.product_id = p.id
AND c.cover_image IS NOT NULL;
