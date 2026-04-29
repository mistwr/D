import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, getCampanhas, getCampanhaById, createCampanha, getCampanhaPDFs, addCampanhaPDF, getAllCampanhaPDFs } from '@/lib/store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const c = getCampanhaById(id)
    if (!c) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    return NextResponse.json({ campanha: c, pdfs: getCampanhaPDFs(id) })
  }
  const campanhas = getCampanhas()
  const allPdfs = getAllCampanhaPDFs()
  const enriched = campanhas.map(c => ({ ...c, pdf_count: allPdfs.filter(p => p.campanha_id === c.id).length }))
  return NextResponse.json({ campanhas: enriched })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  const body = await req.json()

  // Upload PDF para campanha existente
  if (body.action === 'upload_pdf') {
    const c = getCampanhaById(body.campanha_id)
    if (!c) return NextResponse.json({ error: 'Campanha nao encontrada' }, { status: 404 })
    const pdf = addCampanhaPDF(body.campanha_id, body.file_name)
    return NextResponse.json({ pdf, pdfs: getCampanhaPDFs(body.campanha_id) })
  }

  // Criar campanha
  const campanha = createCampanha({
    title: body.title,
    operator: body.operator,
    service_type: body.service_type || 'telecom',
    description: body.description || '',
    status: body.status || 'ativa',
  })
  return NextResponse.json({ campanha })
}
