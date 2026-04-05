'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Loader2, PaintBucket } from 'lucide-react'
import { login, AUTH_ERROR_MESSAGES, type AuthError } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router     = useRouter()
  const storeLogin = useAuthStore(s => s.login)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [touched, setTouched]   = useState({ email: false, password: false })

  const emailInvalid = touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit    = email.trim() !== '' && password !== ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) { setError('Preencha email e senha.'); return }
    setLoading(true)
    setError(null)
    try {
      const usuario = await login({ email, password })
      storeLogin(usuario)
      router.push('/dashboard')
    } catch (err) {
      const msg = AUTH_ERROR_MESSAGES[err as AuthError] ?? 'Erro inesperado. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Painel esquerdo — identidade VG Pinturas ────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: '#0a0a0a' }}
      >
        {/* Brilho laranja — canto superior esquerdo */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }}
        />

        {/* Brilho azul — canto inferior direito */}
        <div
          className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }}
        />

        {/* Linha decorativa laranja → azul no topo */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, #f97316 0%, #38bdf8 100%)' }}
        />

        {/* Conteúdo central */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-sm w-full">

          {/* Logo — frame glassmorphism */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="absolute top-0 left-4 right-4 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center shadow-2xl">
                <PaintBucket className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Nome com gradiente laranja → azul */}
          <div className="space-y-3">
            <h1
              className="text-4xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #f97316 0%, #fb923c 40%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              VG Pinturas
            </h1>
            <p
              className="text-base font-medium italic"
              style={{ color: '#f97316' }}
            >
              &ldquo;Construindo qualidade, pintando confiança.&rdquo;
            </p>
          </div>

          {/* Divisor laranja → azul */}
          <div
            className="w-24 h-px"
            style={{ background: 'linear-gradient(90deg, #f97316, #38bdf8)' }}
          />

          {/* Bullets alternando laranja / azul */}
          <ul className="text-left space-y-3 w-full">
            {[
              { text: 'Gestão completa de obras',     color: '#f97316' },
              { text: 'Controle financeiro por obra', color: '#38bdf8' },
              { text: 'Equipe e lançamentos',         color: '#f97316' },
              { text: 'Exportação de relatórios',     color: '#38bdf8' },
            ].map(item => (
              <li key={item.text} className="flex items-center gap-3 text-sm" style={{ color: '#d1d5db' }}>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
                />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Painel direito — formulário ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">

        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
            <PaintBucket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">VG Pinturas</h1>
          <p className="text-xs text-orange-500 italic text-center">
            &ldquo;Construindo qualidade, pintando confiança.&rdquo;
          </p>
        </div>

        <div className="w-full max-w-md">

          {/* Card do formulário */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

            {/* Barra superior laranja → azul */}
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #f97316 0%, #38bdf8 100%)' }}
            />

            <div className="p-8">
              {/* Cabeçalho */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Bem-vindo</h2>
                <p className="text-sm text-gray-500 mt-1">Faça login para acessar o sistema</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, email: true }))}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition',
                        'focus:outline-none focus:ring-2 focus:border-transparent',
                        emailInvalid
                          ? 'border-red-400 bg-red-50 focus:ring-red-400'
                          : 'border-gray-200 bg-gray-50 focus:ring-orange-400'
                      )}
                    />
                  </div>
                  {emailInvalid && (
                    <p className="text-xs text-red-500">Formato de email inválido.</p>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, password: true }))}
                      placeholder="••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">!</span>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Botão entrar */}
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: canSubmit && !loading
                      ? 'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #38bdf8 100%)'
                      : '#d1d5db',
                    boxShadow: canSubmit && !loading ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
                  }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Autenticando…</>
                    : 'Entrar'}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-gray-400">
              Use o email e senha cadastrados no Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
