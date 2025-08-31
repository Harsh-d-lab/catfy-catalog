import { createClient } from '@/lib/supabase/client'
import { ADMIN_EMAILS } from '@/lib/admin-config'
import type { User } from '@supabase/supabase-js'

export async function getClientUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function isClientAdmin(userId?: string) {
  const user = await getClientUser()
  
  if (!user) {
    return false
  }
  
  // Check if user is admin using the admin configuration
  const userEmail = user.email || ''
  return ADMIN_EMAILS.includes(userEmail) || userEmail.includes('admin') || false
}