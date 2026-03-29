// RPM Pro — Configuração Supabase
const SUPABASE_URL = 'https://roeeyypssutzfzzkypsq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZWV5eXBzc3V0emZ6emt5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTk0MTgsImV4cCI6MjA5MDM5NTQxOH0.9oCOmABUTXox3FaRViD2zcUaqv94VfOJFMQYz_fcJi4';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
