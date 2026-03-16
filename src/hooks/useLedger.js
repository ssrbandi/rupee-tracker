import { useState, useEffect } from 'react'
import {
  doc, collection, onSnapshot,
  setDoc, addDoc, deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { encrypt, decrypt } from '../services/crypto'

export function useLedger(userId) {
  const [balance, setBalance] = useState(0)
  const [tabs, setTabs]       = useState([])
  const [loading, setLoading] = useState(true)

  const userRef = doc(db, 'users', userId)

  // Listen to balance
  useEffect(() => {
    const unsub = onSnapshot(userRef, async (snap) => {
      if (snap.exists()) {
        const raw = snap.data().totalBalance
        const decrypted = await decrypt(raw, userId)
        setBalance(parseFloat(decrypted) || 0)
      } else {
        const encrypted = await encrypt('0', userId)
        setDoc(userRef, { totalBalance: encrypted }, { merge: true })
      }
      setLoading(false)
    })
    return unsub
  }, [userId])

  // Listen to tabs
  useEffect(() => {
    const tabsRef = collection(db, 'users', userId, 'tabs')
    const unsub = onSnapshot(tabsRef, async (snap) => {
      const data = await Promise.all(snap.docs.map(async d => {
        const raw = d.data()
        return {
          id: d.id,
          name: await decrypt(raw.name, userId),
          type: raw.type,
          color: raw.color,
          createdAt: raw.createdAt,
          entries: []
        }
      }))
      setTabs(data)
    })
    return unsub
  }, [userId])

  // Listen to entries for each tab
  useEffect(() => {
    if (tabs.length === 0) return
    const unsubs = tabs.map(tab => {
      const entriesRef = collection(db, 'users', userId, 'tabs', tab.id, 'entries')
      return onSnapshot(entriesRef, async (snap) => {
        const entries = await Promise.all(snap.docs.map(async d => {
          const raw = d.data()
          return {
            id: d.id,
            label: await decrypt(raw.label, userId),
            amount: parseFloat(await decrypt(raw.amount, userId)) || 0,
            date: raw.date,
            createdAt: raw.createdAt
          }
        }))
        setTabs(prev => prev.map(t =>
          t.id === tab.id ? { ...t, entries } : t
        ))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [tabs.length])

  // Update balance
  const updateBalance = async (amount) => {
    const encrypted = await encrypt(String(amount), userId)
    await setDoc(userRef, { totalBalance: encrypted }, { merge: true })
  }

  // Add tab
  const addTab = async (name, type, color) => {
    const encryptedName = await encrypt(name, userId)
    const tabsRef = collection(db, 'users', userId, 'tabs')
    await addDoc(tabsRef, {
      name: encryptedName,
      type,
      color,
      createdAt: Date.now()
    })
  }

  // Delete tab
  const deleteTab = async (tabId) => {
    await deleteDoc(doc(db, 'users', userId, 'tabs', tabId))
  }

  // Add entry
  const addEntry = async (tabId, label, amount) => {
    const [encLabel, encAmount] = await Promise.all([
      encrypt(label, userId),
      encrypt(String(amount), userId)
    ])
    const entriesRef = collection(db, 'users', userId, 'tabs', tabId, 'entries')
    await addDoc(entriesRef, {
      label: encLabel,
      amount: encAmount,
      date: new Date().toISOString(),
      createdAt: Date.now()
    })
  }

  // Delete entry
  const deleteEntry = async (tabId, entryId) => {
    await deleteDoc(doc(db, 'users', userId, 'tabs', tabId, 'entries', entryId))
  }

  // Computed balance
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