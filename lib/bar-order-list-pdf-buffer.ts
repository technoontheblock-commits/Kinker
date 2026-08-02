import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import { BarOrderListPDF, type BarOrderListPDFData } from './bar-order-list-pdf'

export async function generateBarOrderListPdfBuffer(data: BarOrderListPDFData): Promise<Buffer> {
  const stream = await renderToStream(React.createElement(BarOrderListPDF, data) as any)

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
