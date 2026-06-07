const fs = require('fs');
const path = require('path');

const pages = [
  'app/admin/dashboard/page.tsx',
  'app/admin/parceiros/page.tsx',
  'app/admin/leads/page.tsx',
  'app/admin/campanhas/page.tsx',
  'app/admin/comissoes/page.tsx',
  'app/admin/contratos/page.tsx',
  'app/admin/documentos/page.tsx',
  'app/admin/estrutura/page.tsx',
  'app/dashboard/page.tsx',
  'app/vendas/page.tsx',
  'app/contratos/page.tsx',
  'app/materiais/page.tsx',
  'app/publicacoes/page.tsx',
];

const updatePageLayout = (content) => {
  // Se tem background já colorido, remover e deixar ao layout.tsx tratar
  content = content.replace(/style=\{\{\s*background:\s*['"]#[^"']+['"],?\s*[^}]*\}\}/g, '');
  
  // Aumentar padding responsivo em main
  content = content.replace(
    /className="flex-1[^"]*"\s*style=\{\{\s*[^}]*minHeight[^}]*\}\}/g,
    'className="flex-1 overflow-auto" style={{ minHeight: "calc(100vh - 4rem)" }}'
  );
  
  // Aumentar padding
  content = content.replace(
    /p-4\s+md:p-6/g,
    'p-4 sm:p-6 md:p-8 lg:p-12'
  );
  
  // Aumentar max-width
  content = content.replace(
    /max-w-6xl/g,
    'max-w-7xl'
  );
  
  content = content.replace(
    /max-w-5xl/g,
    'max-w-7xl'
  );
  
  return content;
};

pages.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = updatePageLayout(content);
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${file}`);
  } else {
    console.log(`✗ Not found: ${file}`);
  }
});

console.log('\nDone!');
