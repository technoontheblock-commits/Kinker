'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AdminTabContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const AdminTabContext = createContext<AdminTabContextType | undefined>(undefined)

export function AdminTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <AdminTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AdminTabContext.Provider>
  )
}

export function useAdminTab() {
  const context = useContext(AdminTabContext)
  if (!context) {
    throw new Error('useAdminTab must be used within AdminTabProvider')
  }
  return context
}
