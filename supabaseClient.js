import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
//  STEP 1 OF SETUP:
//  Replace the two values below with your own from Supabase.
//  Go to: https://supabase.com → Your Project → Settings → API
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://aenbeyyqgygcnaywugrk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbmJleXlxZ3lnY25heXd1Z3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjQ5NzMsImV4cCI6MjA4OTE0MDk3M30.QGeC6J8Ng4FAWYrnPcSUC26o5NGPZv1PW29s-PzhiyQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
