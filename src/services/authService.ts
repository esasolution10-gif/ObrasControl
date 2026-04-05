import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export type AuthError =
  | 'EMPTY_FIELDS'
  | 'INVALID_EMAIL'
  | 'INVALID_CREDENTIALS'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function login(credentials: LoginCredentials): Promise<Usuario> {
  const { email, password } = credentials
  const emailLimpo = email.trim().toLowerCase()

  if (!emailLimpo || !password) throw 'EMPTY_FIELDS' satisfies AuthError
  if (!isValidEmail(emailLimpo))  throw 'INVALID_EMAIL' satisfies AuthError

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailLimpo,
    password,
  })

  if (error || !data.user) throw 'INVALID_CREDENTIALS' satisfies AuthError

  return {
    id:    data.user.id,
    nome:  data.user.user_metadata?.nome ?? data.user.email ?? 'Usuário',
    email: data.user.email ?? '',
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

export const AUTH_ERROR_MESSAGES: Record<AuthError, string> = {
  EMPTY_FIELDS:        'Preencha email e senha.',
  INVALID_EMAIL:       'Formato de email inválido.',
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
}
