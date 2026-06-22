CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  service_interest text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_contact_inquiries" ON contact_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "select_contact_inquiries" ON contact_inquiries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "update_contact_inquiries" ON contact_inquiries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_contact_inquiries" ON contact_inquiries FOR DELETE
  TO authenticated USING (true);
