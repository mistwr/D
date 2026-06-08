'use client'

import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'

// TEMPORARY test route to verify the flex layout in the browser. Safe to delete.
export default function TestLayoutPage() {
  const mockUser = { full_name: 'Teste Admin', role: 'admin', email: 'teste@sd.com', id: '1' }
  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Navbar user={mockUser} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={true} />
        <main className="flex-1 min-w-0 pt-16 min-h-screen overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold text-blue-900">Enterprise Dashboard</h1>
            <p className="text-slate-500 mb-6">Painel Comercial - teste de alinhamento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {['Vendas 28', 'Taxa 0.0%', 'Parceiros 8', 'Energia EUR1008'].map((t) => (
                <div key={t} className="bg-white rounded-xl shadow p-6 border border-slate-200">
                  <p className="text-2xl font-bold text-blue-900">{t}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 text-sm font-semibold">PARCEIRO</th>
                    <th className="p-3 text-sm font-semibold">VALOR</th>
                    <th className="p-3 text-sm font-semibold">TIPO</th>
                    <th className="p-3 text-sm font-semibold">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-3">Parceiro {i}</td>
                      <td className="p-3">EUR {i}0.00</td>
                      <td className="p-3">Energia</td>
                      <td className="p-3">Pendente</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
