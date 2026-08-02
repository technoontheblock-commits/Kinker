import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import { BarReceiptPDF, type BarReceiptPDFData } from './bar-receipt-pdf'

export async function generateBarReceiptPdfBuffer(data: BarReceiptPDFData): Promise<Buffer> {
  const stream = await renderToStream(React.createElement(BarReceiptPDF, data) as any)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    stream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    stream.on('error', err => {
      reject(err)
    })
  })
}
