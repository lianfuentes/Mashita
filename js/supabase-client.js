// Cliente compartido de Supabase, usado tanto por el sitio público (app.js) como por el panel de administración (admin.js).
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
