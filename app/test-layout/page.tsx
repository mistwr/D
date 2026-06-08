// Minimal public test - no Sidebar/Navbar import to avoid auth checks
export default function TestLayout() {
  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Simulated in-flow sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 flex-col bg-gray-900 h-screen sticky top-0">
        <div className="p-4 text-white font-bold">Sidebar (264px in-flow)</div>
        <div className="p-4 text-gray-400 text-sm">Menu items here...</div>
      </aside>
      {/* Main wrapper takes remaining space */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white shadow flex items-center px-6">
          <span className="font-semibold">Navbar (full remaining width)</span>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-6">
          <h1 className="text-2xl font-bold mb-4">Enterprise Dashboard</h1>
          <p className="text-gray-600 mb-4">Content starts AFTER sidebar. No overlap possible.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Vendas', 'Receita', 'Taxa Conv.', 'Parceiros'].map((c) => (
              <div key={c} className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">{c}</div>
                <div className="text-2xl font-bold mt-1">123</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
