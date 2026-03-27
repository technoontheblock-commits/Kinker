'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import QRCode from 'qrcode'

interface TicketData {
  id: string
  ticket_number: string
  status: 'valid' | 'used' | 'cancelled'
  qr_data: string
  holder_name: string
  holder_email: string
  event: {
    name: string
    date: string
    time: string
    image: string
    venue: string
  }
}

// Generate QR code as data URL
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('QR Code generation error:', err)
    return ''
  }
}

// PDF Document Component
export function TicketPDF({ ticket, qrCodeDataUrl }: { 
  ticket: TicketData
  qrCodeDataUrl: string
}) {
  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#000000',
      padding: 0,
      fontFamily: 'Helvetica',
      height: '100%',
    },
    header: {
      backgroundColor: '#dc2626',
      padding: 20,
      alignItems: 'center',
    },
    logo: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      letterSpacing: 3,
    },
    subtitle: {
      fontSize: 9,
      color: '#ffffff',
      marginTop: 2,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    content: {
      padding: 25,
      flex: 1,
    },
    statusBadge: {
      alignSelf: 'center',
      backgroundColor: ticket.status === 'valid' ? '#dcfce7' : '#f3f4f6',
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: 15,
      marginBottom: 15,
    },
    statusText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: ticket.status === 'valid' ? '#16a34a' : '#6b7280',
      textTransform: 'uppercase',
    },
    eventName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 15,
      textAlign: 'center',
    },
    infoSection: {
      backgroundColor: '#171717',
      borderRadius: 6,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: '#262626',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 9,
      color: '#737373',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 12,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#262626',
      marginVertical: 8,
    },
    qrSection: {
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 15,
      marginBottom: 12,
    },
    qrCode: {
      width: 130,
      height: 130,
    },
    qrText: {
      fontSize: 8,
      color: '#525252',
      marginTop: 8,
      fontFamily: 'Courier',
    },
    ticketNumber: {
      fontSize: 12,
      color: '#dc2626',
      textAlign: 'center',
      fontWeight: 'bold',
      letterSpacing: 1.5,
    },
    footer: {
      paddingHorizontal: 25,
      paddingBottom: 15,
      textAlign: 'center',
    },
    footerText: {
      fontSize: 8,
      color: '#525252',
      marginBottom: 3,
    },
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-CH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>KINKER</Text>
          <Text style={styles.subtitle}>BASEL - HARD TECHNO</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{ticket.status}</Text>
          </View>

          {/* Event Name */}
          <Text style={styles.eventName}>{ticket.event.name}</Text>

          {/* Event Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(ticket.event.date)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{ticket.event.time}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{ticket.event.venue || 'KINKER Basel'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Holder</Text>
              <Text style={styles.infoValue}>{ticket.holder_name}</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            {qrCodeDataUrl && (
              <Image src={qrCodeDataUrl} style={styles.qrCode} />
            )}
            <Text style={styles.qrText}>{ticket.qr_data}</Text>
          </View>

          {/* Ticket Number */}
          <Text style={styles.ticketNumber}>TICKET #{ticket.ticket_number}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Barcelona-Strasse 4, 4142 Münchenstein, Switzerland | www.kinker.ch
          </Text>
          <Text style={styles.footerText}>
            Valid for one entry only. Present this ticket at the entrance.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
