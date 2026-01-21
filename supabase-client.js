
// Initialize Supabase Client
// Project ID inferred from screenshot: wfnilytdowsobyshysij
const supabaseUrl = 'https://wfnilytdowsobyshysij.supabase.co';
// FONTOS: A képernyőképen a kulcs le volt vágva (...) ezért kérlek másold be ide a teljes 'anon public' kulcsot a Supabase Dashboard-ról.
const supabaseKey = 'sb_publishable_nzBfGbKBAdp_9lUWZHc8vw_Cq-1ds_U';

// Helper to check if supabase is loaded
let supabaseInstance = null;

function getSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded!');
        return null;
    }
    if (!supabaseInstance) {
        supabaseInstance = supabase.createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
}

// Auth Functions
async function signInWithGoogle() {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
    })
    if (error) {
        console.error('Error logging in:', error);
        alert("Google Login Error: " + error.message);
    }
}

async function signUpWithEmail(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
        email: email,
        password: password,
    });
    return { data, error };
}

async function signInWithEmail(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password,
    });
    return { data, error };
}

async function signOut() {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signOut();
    if (error) console.error('Error signing out:', error);
    else window.location.reload();
}

async function checkUser() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    return user;
}
