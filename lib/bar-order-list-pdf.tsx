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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  eventInfo: {
    marginBottom: 20,
    textAlign: 'center',
  },
  eventName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    color: '#666666',
    fontSize: 11,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
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
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  colName: {
    flex: 5,
  },
  colQty: {
    flex: 2,
    textAlign: 'center',
  },
  colTotal: {
    flex: 2,
    textAlign: 'right',
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
  summaryBox: {
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    color: '#666666',
  },
  summaryValue: {
    fontWeight: 'bold',
  },
})

export interface BarOrderListPDFData {
  eventName: string
  eventDate: string
  createdAt: string
  categories: {
    name: string
    items: { name: string; quantity: number; total: number }[]
  }[]
  totalQuantity: number
  totalRevenue: number
  currency: string
}

export function BarOrderListPDF({
  eventName,
  eventDate,
  createdAt,
  categories,
  totalQuantity,
  totalRevenue,
  currency,
}: BarOrderListPDFData) {
  const format = (amount: number) => `${currency} ${amount.toFixed(2)}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>KINKER BASEL</Text>
          <Text style={styles.subtitle}>Automatische Bestellliste</Text>
        </View>

        <Text style={styles.title}>Bestellliste</Text>

        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{eventName}</Text>
          <Text style={styles.eventDate}>{eventDate}</Text>
          <Text style={styles.eventDate}>Erstellt am {createdAt}</Text>
        </View>

        {categories.map((category, categoryIndex) => (
          <View key={categoryIndex}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colName}>Produkt</Text>
              <Text style={styles.colQty}>Menge</Text>
              <Text style={styles.colTotal}>Umsatz</Text>
            </View>
            {category.items.map((item, itemIndex) => (
              <View style={styles.row} key={itemIndex}>
                <Text style={styles.colName}>{item.name}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colTotal}>{format(item.total)}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gesamtmenge</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gesamtumsatz</Text>
            <Text style={styles.summaryValue}>{format(totalRevenue)}</Text>
          </View>
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
