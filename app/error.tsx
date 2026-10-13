'use client'
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-md rounded-xl border bg-white p-6"><h1 className="text-xl font-bold">Não foi possível carregar o CRM</h1><p role="alert" className="my-4 text-slate-600">A ligação ou a confirmação da sessão falhou. Os teus registos continuam guardados.</p><button className="rounded-lg bg-sky-600 px-4 py-2 text-white" onClick={reset}>Tentar novamente</button><button className="ml-3 underline" onClick={()=>window.location.reload()}>Atualizar página</button></div></main>
}
