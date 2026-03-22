import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tnqarmervjywnixrqyji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucWFybWVydmp5d25peHJxeWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzAyODYsImV4cCI6MjA4OTQ0NjI4Nn0.c0SJO2qGWBo4wx73nmhF5WVh1jHC9nhsGlLvzztj9Y8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
