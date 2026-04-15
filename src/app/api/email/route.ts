import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/email
 *
 * Envia um email com o PDF do orçamento em anexo.
 *
 * Requer a variável de ambiente:
 *   RESEND_API_KEY=re_xxxxxxxxxxxx
 *
 * Para activar:
 *   1. npm install resend
 *   2. Adicionar RESEND_API_KEY no .env.local e nas variáveis do Vercel
 *   3. Descomentar o bloco "Resend implementation" abaixo
 *   4. Ajustar o campo "from" com o domínio verificado no Resend
 */

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { para, assunto, mensagem, pdfBase64, nomeArquivo } = body

  if (!para || !assunto) {
    return NextResponse.json(
      { erro: 'Os campos "para" e "assunto" são obrigatórios.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        erro: 'Serviço de email não configurado. Adicione RESEND_API_KEY nas variáveis de ambiente e descomente o código em src/app/api/email/route.ts.',
      },
      { status: 501 },
    )
  }

  // ── Resend implementation ─────────────────────────────────────────────────
  // Descomente após: npm install resend
  //
  // import { Resend } from 'resend'
  // const resend = new Resend(apiKey)
  //
  // const attachments = pdfBase64
  //   ? [{ filename: nomeArquivo, content: pdfBase64 }]
  //   : []
  //
  // const { error } = await resend.emails.send({
  //   from:        'VG Pinturas <orcamentos@seudominio.pt>',
  //   to:          [para],
  //   subject:     assunto,
  //   text:        mensagem,
  //   attachments,
  // })
  //
  // if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  // return NextResponse.json({ sucesso: true })
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json(
    { erro: 'RESEND_API_KEY configurada mas implementação comentada. Ver src/app/api/email/route.ts.' },
    { status: 501 },
  )
}
