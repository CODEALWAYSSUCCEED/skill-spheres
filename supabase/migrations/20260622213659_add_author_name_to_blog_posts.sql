ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_name text;
UPDATE blog_posts SET author_name = author WHERE author_name IS NULL;
