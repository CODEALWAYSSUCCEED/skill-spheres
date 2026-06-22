CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  category text,
  cover_image_url text,
  read_time_minutes integer DEFAULT 5,
  author text DEFAULT '317 Solutions Team',
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_blog_posts" ON blog_posts
  FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "auth_manage_blog_posts" ON blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
