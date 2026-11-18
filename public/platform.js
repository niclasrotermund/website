// Website auf eigener Domain: stellt dasselbe window.claude.use("db" | "user" | "assets") bereit,
// das die Seite im claude.ai-Entwurf nutzt, aber mit Supabase dahinter (Tabelle site_docs, Bucket "website").
// Besucher brauchen kein Konto. Bearbeiten darf nur der Hauptadmin des Tourbuchs (public.site_admin()).
(() => {
  "use strict";
  const C = window.NR_CONFIG || {};
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  const ref = (C.supabaseUrl.match(/https:\/\/([^.]+)\./) || [])[1];
  const hasSession = () => { try { return !!localStorage.getItem("sb-" + ref + "-auth-token"); } catch (e) { return false; } };

  // the page reads this synchronously for the login form in the internal area
  window.NR_SITE = {
    signedIn: hasSession(),
    signIn: async (email, password) => {
      const r = await sb.auth.signInWithPassword({ email, password });
      if (r.error) throw new Error(/Invalid login/i.test(r.error.message) ? "E-Mail oder Passwort stimmt nicht." : r.error.message);
    },
    signOut: async () => { await sb.auth.signOut(); }
  };

  const ready = (async () => {
    const { data: { session } } = await sb.auth.getSession();
    window.NR_SITE.signedIn = !!session;
    let admin = false;
    if (session) { const r = await sb.rpc("site_admin"); admin = r.data === true; }
    return { admin };
  })();

  /* ---------- documents ---------- */
  const cache = new Map(), subs = new Set(); let loaded = null;
  const snapDoc = path => ({ exists: cache.has(path), id: path.split("/").pop(), data: () => cache.get(path), metadata: { fromCache: false } });
  const inColl = (path, coll) => path.startsWith(coll + "/") && path.split("/").length === coll.split("/").length + 1;
  const notify = path => subs.forEach(s => { if (s.doc ? s.path === path : inColl(path, s.path)) s.fire(); });
  async function load(){
    if (loaded) return loaded;
    return loaded = (async () => {
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from("site_docs").select("path,data").range(from, from + 999);
        if (error) throw error;
        data.forEach(r => cache.set(r.path, r.data));
        if (data.length < 1000) break;
      }
      const me = await ready;
      if (me.admin) {
        // live updates only in the internal area (e.g. a second device)
        sb.channel("site_docs").on("postgres_changes", { event: "*", schema: "public", table: "site_docs" }, ev => {
          const path = (ev.new && ev.new.path) || (ev.old && ev.old.path); if (!path) return;
          if (ev.eventType === "DELETE") cache.delete(path); else cache.set(path, ev.new.data);
          notify(path);
        }).subscribe();
      }
    })();
  }
  const clone = d => JSON.parse(JSON.stringify(d));
  const write = async (path, data) => {
    cache.set(path, data); notify(path);
    const { error } = await sb.from("site_docs").upsert({ path, data, updated_at: new Date().toISOString() });
    if (error) throw error;
  };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 20);
  function doc(path){
    return {
      id: path.split("/").pop(),
      get: async () => { await load(); return snapDoc(path); },
      set: data => write(path, clone(data)),
      update: async patch => write(path, { ...(cache.get(path) || {}), ...clone(patch) }),
      delete: async () => { cache.delete(path); notify(path); const { error } = await sb.from("site_docs").delete().eq("path", path); if (error) throw error; },
      onSnapshot(cb, fail){ const s = { doc: true, path, fire: () => cb(snapDoc(path)) }; subs.add(s); load().then(s.fire, fail || (() => {})); return () => subs.delete(s); }
    };
  }
  function collection(path){
    return {
      doc: id => doc(path + "/" + (id || newId())),
      add: async data => { const d = doc(path + "/" + newId()); await d.set(data); return d; },
      onSnapshot(cb, fail){
        const s = { doc: false, path, fire: () => cb({ docs: [...cache.keys()].filter(p => inColl(p, path)).map(snapDoc), metadata: { fromCache: false } }) };
        subs.add(s); load().then(s.fire, fail || (() => {})); return () => subs.delete(s);
      }
    };
  }
  const db = { doc, collection };

  /* ---------- photo uploads (public bucket, served under /_blob/ via vercel.json) ---------- */
  const assets = {
    upload: async file => {
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[file.type] || "bin";
      const id = newId() + "." + ext;
      const { error } = await sb.storage.from(C.bucket).upload(id, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) throw error;
      return { id };
    }
  };

  window.claude = { use: async name => {
    const me = await ready;
    if (name === "db") return db;
    if (name === "user") return { canEdit: () => me.admin };
    if (name === "assets") return me.admin ? assets : null;
    return null;
  } };
})();
