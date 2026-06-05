'use client'

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0a0a0a',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  cardContainer: {
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  brand: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  holderSection: {
    marginBottom: 40,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Courier',
  },
  price: {
    color: '#dc2626',
    fontSize: 24,
    fontWeight: 'bold',
  },
  qrOnCard: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrOnCardImage: {
    width: 160,
    height: 160,
    backgroundColor: '#ffffff',
    padding: 8,
  },
  paymentSection: {
    marginTop: 40,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  paymentTitle: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paymentText: {
    color: '#666666',
    fontSize: 11,
    marginBottom: 4,
  },
  paymentBold: {
    color: '#111111',
    fontSize: 11,
    fontWeight: 'bold',
  },
  paymentMono: {
    color: '#111111',
    fontSize: 11,
    fontFamily: 'Courier',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
})

interface BonusCardPDFProps {
  holderName: string
  cardNumber: string
  purchaseDate: string
  qrCodeDataUrl: string
  paymentMethod: string
  isPaid: boolean
  purchasePrice?: number
}

export function BonusCardPDF({
  holderName,
  cardNumber,
  purchaseDate,
  qrCodeDataUrl,
  paymentMethod,
  isPaid,
  purchasePrice = 10000,
}: BonusCardPDFProps) {
  const showPaymentInfo = paymentMethod === 'bank_transfer' && !isPaid
  const priceChf = (purchasePrice / 100).toFixed(2)
  const hasDiscount = purchasePrice < 10000

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>KINKER BASEL</Text>
              <Text style={styles.subtitle}>MEMBERSHIP</Text>
            </View>
          </View>

          <View style={styles.holderSection}>
            <Text style={styles.label}>Karteninhaber</Text>
            <Text style={styles.value}>{holderName}</Text>
          </View>

          <View style={styles.qrOnCard}>
            <Image src={qrCodeDataUrl} style={styles.qrOnCardImage} />
          </View>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.label}>Kartennummer</Text>
              <Text style={styles.cardNumber}>{cardNumber}</Text>
            </View>
            <View>
              <Text style={styles.price}>CHF {priceChf}</Text>
              {hasDiscount && <Text style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>10% Rabatt</Text>}
            </View>
          </View>
        </View>

        {showPaymentInfo && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Zahlungsinformationen</Text>
            <Text style={styles.paymentText}>
              Bitte überweise <Text style={styles.paymentBold}>CHF {priceChf}</Text> auf folgendes Konto:
            </Text>
            <Text style={styles.paymentMono}>IBAN: CH93 0076 2011 6238 5295 7</Text>
            <Text style={styles.paymentMono}>BIC: BKBKCH22</Text>
            <Text style={styles.paymentMono}>Konto: KINKER GmbH</Text>
            <Text style={styles.paymentText}>
              Verwendungszweck: <Text style={styles.paymentBold}>{cardNumber}</Text>
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gekauft am {purchaseDate} • Bei Fragen: support@kinker.ch
          </Text>
        </View>
      </Page>
    </Document>
  )
}
