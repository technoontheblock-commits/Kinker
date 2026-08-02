'use client'

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#111111',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dc2626',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  metaLabel: {
    color: '#666666',
  },
  metaValue: {
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#666666',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  colName: {
    flex: 5,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 2,
    textAlign: 'right',
  },
  colTotal: {
    flex: 2,
    textAlign: 'right',
  },
  totals: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    color: '#666666',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: '#dc2626',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  grandTotalValue: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  balanceBox: {
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#666666',
    fontSize: 10,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#999999',
    fontSize: 9,
    textAlign: 'center',
  },
})

export interface BarReceiptPDFData {
  orderNumber: string
  createdAt: string
  items: { name: string; quantity: number; price: number; total: number }[]
  subtotal: number
  tip: number
  total: number
  remainingBalance: number
  currency: string
  barName?: string
  eventName?: string
}

export function BarReceiptPDF({
  orderNumber,
  createdAt,
  items,
  subtotal,
  tip,
  total,
  remainingBalance,
  currency,
  barName,
  eventName,
}: BarReceiptPDFData) {
  const format = (amount: number) => `${currency} ${amount.toFixed(2)}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>KINKER BASEL</Text>
          <Text style={styles.subtitle}>Bar-Beleg</Text>
        </View>

        <Text style={styles.title}>Dein Bar-Beleg</Text>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Bestellnummer</Text>
            <Text style={styles.metaValue}>{orderNumber}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{createdAt}</Text>
          </View>
        </View>

        {(eventName || barName) && (
          <View style={{ marginBottom: 12 }}>
            {eventName && <Text style={styles.metaLabel}>Event: {eventName}</Text>}
            {barName && <Text style={styles.metaLabel}>Bar: {barName}</Text>}
          </View>
        )}

        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Artikel</Text>
          <Text style={styles.colQty}>Menge</Text>
          <Text style={styles.colPrice}>Preis</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {items.map((item, index) => (
          <View style={styles.row} key={index}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{format(item.price)}</Text>
            <Text style={styles.colTotal}>{format(item.total)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Zwischensumme</Text>
            <Text>{format(subtotal)}</Text>
          </View>
          {tip > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Trinkgeld</Text>
              <Text>{format(tip)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>BEZAHLT</Text>
            <Text style={styles.grandTotalValue}>{format(total)}</Text>
          </View>
        </View>

        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Restguthaben auf dem Armband</Text>
          <Text style={styles.balanceValue}>{format(remainingBalance)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            KINKER GmbH • Barcelona-Strasse 4, 4142 Münchenstein
          </Text>
          <Text style={styles.footerText}>support@kinker.ch • www.kinker.ch</Text>
        </View>
      </Page>
    </Document>
  )
}
