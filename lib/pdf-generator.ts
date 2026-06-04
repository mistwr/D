import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface PDFGenerationOptions {
  filename: string
  htmlContent: string
  documentType: 'FA' | 'Portabilidade' | 'Rescisao'
}

/**
 * Gera um PDF a partir de HTML
 * Usado para gerar FA, Portabilidade e Rescisão
 */
export async function generatePDFFromHTML(options: PDFGenerationOptions): Promise<Blob> {
  const { filename, htmlContent, documentType } = options

  try {
    // Criar elemento temporário para conter o HTML
    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.padding = '20px'
    element.style.backgroundColor = 'white'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    document.body.appendChild(element)

    // Converter HTML para canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Remover elemento temporário
    document.body.removeChild(element)

    // Calcular dimensões do PDF
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const ratio = canvasWidth / canvasHeight

    // Criar PDF
    const pdf = new jsPDF({
      orientation: ratio > 1 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const finalWidth = ratio > 1 ? pageHeight : pageWidth
    const finalHeight = finalWidth / ratio

    // Adicionar imagem ao PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight)

    // Salvar PDF
    return pdf.output('blob')
  } catch (error) {
    console.error('[v0] Error generating PDF:', error)
    throw error
  }
}

/**
 * Função para substituir placeholders em template HTML
 */
export function replacePlaceholders(template: string, data: Record<string, string | number>): string {
  let result = template
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(placeholder, String(value || ''))
  })
  return result
}

/**
 * Cria template HTML editável com campos pré-preenchidos
 */
export function createEditableTemplate(htmlContent: string, documentType: string): string {
  return `
    <div class="document-editor" data-type="${documentType}">
      <div class="editor-toolbar">
        <button class="btn-download">Descarregar PDF</button>
        <button class="btn-reset">Reverter</button>
      </div>
      <div class="editable-content" contenteditable="true">
        ${htmlContent}
      </div>
    </div>
  `
}
