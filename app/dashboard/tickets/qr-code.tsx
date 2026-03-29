'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeProps {
  value: string
  size?: number
}

export function TicketQRCode({ value, size = 128 }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    generateQR()
  }, [value])

  const generateQR = async () => {
    try {
      const url = await QRCode.toDataURL(value, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
      setDataUrl(url)
    } catch (err) {
      console.error('QR generation error:', err)
    }
  }

  if (!dataUrl) {
    return (
      <div 
        className="bg-gray-100 animate-pulse"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <img 
      src={dataUrl} 
      alt="Ticket QR Code"
      width={size}
      height={size}
      className="block"
    />
  )
}
