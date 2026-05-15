import { createClient } from '@supabase/supabase-js'

// Vite loads variables from .env into import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This log will help you see if the variables are being loaded
console.log('Supabase Connection Status:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  source: import.meta.env.MODE // Should be 'development' when running npm run dev
})

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null
