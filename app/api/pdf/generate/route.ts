import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json()
    
    if (!html) {
      return NextResponse.json({ error: 'HTML conteúdo obrigatório' }, { status: 400 })
    }

    // Criar elemento temporário para renderizar HTML
    const element = document.createElement('div')
    element.innerHTML = html
    element.style.padding = '20px'
    element.style.background = 'white'
    element.style.width = '210mm' // A4 width
    
    // Converter HTML para Canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    
    // Criar PDF a partir do Canvas
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let heightLeft = imgHeight
    let position = 0
    
    // Adicionar múltiplas páginas se necessário
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // Retornar PDF como blob
    const pdfBlob = pdf.output('blob')
    
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'documento.pdf'}"`
      }
    })
  } catch (error) {
    console.log('[v0] Error generating PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
