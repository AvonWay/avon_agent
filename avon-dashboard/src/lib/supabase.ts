import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pilohhrunoaqhkzoqwfi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbG9oaHJ1bm9hcWhrem9xd2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjAxMzksImV4cCI6MjA4NjU5NjEzOX0.ZhpxQOQlyyik0OhLLM0MdICDGWBU_WxO03GLgqQM208'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
