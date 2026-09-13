import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'O registo público está desativado. As contas são criadas pelo administrador PARCENDi.' },
    { status: 403 },
  )
}
