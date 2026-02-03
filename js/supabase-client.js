let _supabase;

// Funzione per inizializzare Supabase in sicurezza
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error("Errore: Libreria Supabase non caricata!");
        return null;
    }
    const supabaseUrl = 'https://vyjwbbndvceezwsmpgsm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5andiYm5kdmNlZXp3c21wZ3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjIzNjQsImV4cCI6MjA4NTMzODM2NH0.GVm-_HpgROSnJ6O8tOV83JR_r9hgriFt01y9n10iqsA';
    return supabase.createClient(supabaseUrl, supabaseKey);
}

async function getTopScores(gameName) {
    if (!_supabase) _supabase = initSupabase();
    if (!_supabase) return [];

    const { data, error } = await _supabase
        .from('scoreboard')
        .select('player, points')
        .eq('game', gameName)
        .order('points', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Errore caricamento:", error);
        return [];
    }
    return data;
}

async function saveScore(gameName, playerName, scorePoints) {
    if (!_supabase) _supabase = initSupabase();
    if (!_supabase) return false;

    const { data, error } = await _supabase
        .from('scoreboard')
        .insert([{ game: gameName, player: playerName, points: parseInt(scorePoints) }]);

    return !error;
}