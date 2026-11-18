// Öffentliche Einstellungen für den Browser. Der anon-Schlüssel darf öffentlich sein: Die Zugriffsregeln in supabase/website.sql schützen die Daten.
// Dieselbe Supabase-Datenbank wie das Tourbuch, aber eigene Tabelle (site_docs) und eigener Foto-Speicher (Bucket "website").
window.NR_CONFIG = {
  supabaseUrl: "https://uwuyxcrnzxohupzeesic.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dXl4Y3JuenhvaHVwemVlc2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MzYyNDMsImV4cCI6MjEwODAxMjI0M30.POZ7LQWIlh97ow44ktsH1eEoGzmBjDc3ZHIJu98QDHg",
  bucket: "website"
};
