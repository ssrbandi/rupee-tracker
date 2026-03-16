import { useState, useEffect } from 'react'
import {
  doc, collection, onSnapshot,
  setDoc, addDoc, deleteDoc, updateDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { v4 as uuidv4 } from 'uuid'

export function useLedger(userId) {
  const [balance, setBalance]   = useState(0)
  const [tabs, setTabs]         = useState([])
  const [loading, setLoading]   = useState(true)

  const userRef = doc(db, 'users', userId)

  // Listen to balance
  useEffect(() => {
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data().totalBalance ?? 0)
      } else {
        setDoc(userRef, { totalBalance: 0 })
      }
      setLoading(false)
    })
    return unsub
  }, [userId])

  // Listen to tabs
  useEffect(() => {
    const tabsRef = collection(db, 'users', userId, 'tabs')
    const unsub = onSnapshot(tabsRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), entries: [] }))
      setTabs(data)
    })
    return unsub
  }, [userId])

  // Listen to entries for each tab
  useEffect(() => {
    if (tabs.length === 0) return
    const unsubs = tabs.map(tab => {
      const entriesRef = collection(db, 'users', userId, 'tabs', tab.id, 'entries')
      return onSnapshot(entriesRef, (snap) => {
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setTabs(prev => prev.map(t =>
          t.id === tab.id ? { ...t, entries } : t
        ))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [tabs.length])

  // Update balance
  const updateBalance = async (amount) => {
    await setDoc(userRef, { totalBalance: amount }, { merge: true })
  }

  // Add tab
  const addTab = async (name, type, color) => {
    const tabsRef = collection(db, 'users', userId, 'tabs')
    await addDoc(tabsRef, { name, type, color, createdAt: Date.now() })
  }

  // Delete tab
  const deleteTab = async (tabId) => {
    await deleteDoc(doc(db, 'users', userId, 'tabs', tabId))
  }

  // Add entry
  const addEntry = async (tabId, label, amount) => {
    const entriesRef = collection(db, 'users', userId, 'tabs', tabId, 'entries')
    await addDoc(entriesRef, {
      label,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      createdAt: Date.now()
    })
  }

  // Delete entry
  const deleteEntry = async (tabId, entryId) => {
    await deleteDoc(doc(db, 'users', userId, 'tabs', tabId, 'entries', entryId))
  }

  // Computed balance = totalBalance + all income - all expenses
  const computedBalance = tabs.reduce((bal, tab) => {
    const tabTotal = tab.entries.reduce((s, e) => s + (e.amount || 0), 0)
    return tab.type === 'income' ? bal + tabTotal : bal - tabTotal
  }, balance)

  return {
    balance,
    computedBalance,
    tabs,
    loading,
    updateBalance,
    addTab,
    deleteTab,
    addEntry,
    deleteEntry
  }
}