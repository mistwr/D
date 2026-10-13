export function withTimeout<T>(work:PromiseLike<T>, milliseconds=18000):Promise<T> {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('A ligação demorou demasiado. Tenta novamente.')),milliseconds)
    Promise.resolve(work).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})
  })
}
export async function readJSON<T=any>(response:Response):Promise<T> {
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Não foi possível confirmar a sessão. Atualiza a página e tenta novamente.')
  const data=await withTimeout(response.json())
  if(!response.ok)throw new Error(data.error||'Não foi possível carregar os dados.')
  return data as T
}
export async function loadWithState<T>(load:()=>Promise<T>,handlers:{success:(data:T)=>void;failure:(message:string)=>void;finished:()=>void}) {
  try {handlers.success(await load())}
  catch(error){handlers.failure(error instanceof Error?error.message:'Não foi possível carregar os dados.')}
  finally{handlers.finished()}
}
