import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useLedger } from '../hooks/useLedger'

const COLORS = ['#FF6B6B','#4ECDC4','#FFD93D','#6BCB77','#A78BFA','#F97316','#38BDF8','#FB7185']
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function HomeScreen({ user, userName }) {
  const { balance, computedBalance, tabs, loading, updateBalance, addTab, deleteTab, addEntry, deleteEntry } = useLedger(user.uid)

  const [activeTab, setActiveTab]         = useState(null)
  const [showAddTab, setShowAddTab]       = useState(false)
  const [showAddEntry, setShowAddEntry]   = useState(false)
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput]   = useState('')
  const [newTabName, setNewTabName]       = useState('')
  const [newTabType, setNewTabType]       = useState('expense')
  const [newTabColor, setNewTabColor]     = useState(COLORS[0])
  const [entryLabel, setEntryLabel]       = useState('')
  const [entryAmount, setEntryAmount]     = useState('')

  const currentTab = tabs.find(t => t.id === activeTab)

  const handleUpdateBalance = async () => {
    const val = parseFloat(balanceInput)
    if (!isNaN(val)) await updateBalance(val)
    setEditingBalance(false)
  }

  const handleAddTab = async () => {
    if (!newTabName.trim()) return
    await addTab(newTabName.trim(), newTabType, newTabColor)
    setNewTabName('')
    setNewTabType('expense')
    setShowAddTab(false)
  }

  const handleAddEntry = async () => {
    if (!entryLabel.trim() || !entryAmount) return
    await addEntry(activeTab, entryLabel.trim(), entryAmount)
    setEntryLabel('')
    setEntryAmount('')
    setShowAddEntry(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#a78bfa', fontSize: 13 }}>Loading…</div>
    </div>
  )

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <span style={s.label}>Good day, {userName} 👋</span>
          <button style={s.signOutBtn} onClick={() => signOut(auth)}>Sign out</button>
        </div>

        {editingBalance ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 24 }}>₹</span>
            <input
              autoFocus
              type="number"
              value={balanceInput}
              onChange={e => setBalanceInput(e.target.value)}
              onBlur={handleUpdateBalance}
              onKeyDown={e => e.key === 'Enter' && handleUpdateBalance()}
              style={s.balanceInput}
            />
          </div>
        ) : (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => { setBalanceInput(balance.toString()); setEditingBalance(true) }}
          >
            <span style={{ ...s.balanceVal, color: computedBalance >= 0 ? '#6ee7b7' : '#fca5a5' }}>
              {fmt(computedBalance)}
            </span>
            <span style={s.tapHint}> tap to set</span>
          </div>
        )}

        {/* Tab summary pills */}
        <div style={s.pillRow}>
          {tabs.map(t => {
            const total = t.entries.reduce((s, e) => s + e.amount, 0)
            return (
              <div key={t.id} style={{ ...s.pill, background: t.color + '22', border: `1px solid ${t.color}55` }}>
                <span style={{ ...s.pillDot, background: t.color }} />
                <span style={s.pillName}>{t.name}</span>
                <span style={{ ...s.pillAmt, color: t.type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(total)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...s.tabBtn,
              color: activeTab === t.id ? t.color : '#666',
              borderBottom: activeTab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              background: activeTab === t.id ? t.color + '18' : 'transparent'
            }}
          >
            {t.type === 'expense' ? '↓' : '↑'} {t.name}
          </button>
        ))}
        <button style={s.addTabBtn} onClick={() => setShowAddTab(true)}>＋ Tab</button>
      </div>

      {/* Tab content */}
      <div style={s.content}>
        {!currentTab ? (
          <div style={s.emptyState}>
            <p style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
              {tabs.length === 0
                ? 'Create your first tab — salary, fertilizer, sales…'
                : 'Select a tab to view entries'}
            </p>
          </div>
        ) : (
          <>
            <div style={s.tabHeader}>
              <div>
                <span style={{ color: '#888', fontSize: 13 }}>
                  {currentTab.type === 'expense' ? '↓ Expense' : '↑ Income'} · {currentTab.entries.length} entries
                </span>
                <div style={{ color: currentTab.type === 'income' ? '#6ee7b7' : '#fca5a5', fontWeight: 700, fontSize: 16 }}>
                  {currentTab.type === 'income' ? '+' : '-'}
                  {fmt(currentTab.entries.reduce((s, e) => s + e.amount, 0))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ ...s.deleteTabBtn }}
                  onClick={() => { deleteTab(currentTab.id); setActiveTab(null) }}
                >
                  Delete tab
                </button>
                <button
                  style={{ ...s.addEntryBtn, background: currentTab.color }}
                  onClick={() => setShowAddEntry(true)}
                >
                  + Entry
                </button>
              </div>
            </div>

            {/* Entries */}
            {currentTab.entries.length === 0 ? (
              <div style={s.emptyState}>
                <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>
                  No entries yet. Tap "+ Entry" to add.
                </p>
              </div>
            ) : (
              [...currentTab.entries]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map(entry => (
                  <div key={entry.id} style={s.entryRow}>
                    <div style={s.entryLeft}>
                      <span style={{ ...s.entrySign, color: currentTab.type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                        {currentTab.type === 'income' ? '+' : '-'}
                      </span>
                      <div>
                        <div style={s.entryLabel}>{entry.label}</div>
                        <div style={s.entryDate}>
                          {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ ...s.entryAmt, color: currentTab.type === 'income' ? '#6ee7b7' : '#fca5a5' }}>
                        {fmt(entry.amount)}
                      </span>
                      <button style={s.delBtn} onClick={() => deleteEntry(currentTab.id, entry.id)}>×</button>
                    </div>
                  </div>
                ))
            )}
          </>
        )}
      </div>

      {/* Add Tab Modal */}
      {showAddTab && (
        <div style={s.overlay} onClick={() => setShowAddTab(false)}>
          <div style={s.sheet} onClick={e => e.stopPropagation()}>
            <div style={s.sheetTitle}>New Tab</div>

            <div style={s.fieldLabel}>Tab Name</div>
            <input
              autoFocus
              style={s.fieldInput}
              placeholder="e.g. Fertilizer, Sales, Salary…"
              value={newTabName}
              onChange={e => setNewTabName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTab()}
            />

            <div style={s.fieldLabel}>Type</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setNewTabType('expense')}
                style={{
                  ...s.typeBtn,
                  background: newTabType === 'expense' ? '#FF6B6B22' : '#ffffff0d',
                  border: newTabType === 'expense' ? '1px solid #FF6B6B' : '1px solid #ffffff15',
                  color: newTabType === 'expense' ? '#FF6B6B' : '#888'
                }}
              >
                ↓ Expense
              </button>
              <button
                onClick={() => setNewTabType('income')}
                style={{
                  ...s.typeBtn,
                  background: newTabType === 'income' ? '#6ee7b722' : '#ffffff0d',
                  border: newTabType === 'income' ? '1px solid #6ee7b7' : '1px solid #ffffff15',
                  color: newTabType === 'income' ? '#6ee7b7' : '#888'
                }}
              >
                ↑ Income
              </button>
            </div>

            <div style={s.fieldLabel}>Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setNewTabColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c, cursor: 'pointer',
                    border: newTabColor === c ? '3px solid #fff' : '3px solid transparent'
                  }}
                />
              ))}
            </div>

            <button
              style={{ ...s.sheetBtn, background: newTabColor, marginTop: 20 }}
              onClick={handleAddTab}
            >
              Create Tab
            </button>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddEntry && currentTab && (
        <div style={s.overlay} onClick={() => setShowAddEntry(false)}>
          <div style={s.sheet} onClick={e => e.stopPropagation()}>
            <div style={s.sheetTitle}>Add Entry to "{currentTab.name}"</div>

            <div style={s.fieldLabel}>Label</div>
            <input
              autoFocus
              style={s.fieldInput}
              placeholder="e.g. DAP Fertilizer, June Salary…"
              value={entryLabel}
              onChange={e => setEntryLabel(e.target.value)}
            />

            <div style={s.fieldLabel}>Amount (₹)</div>
            <input
              style={s.fieldInput}
              type="number"
              placeholder="e.g. 4500"
              value={entryAmount}
              onChange={e => setEntryAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddEntry()}
            />

            <button
              style={{ ...s.sheetBtn, background: currentTab.color, marginTop: 20 }}
              onClick={handleAddEntry}
            >
              Add Entry
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

const s = {
  container:    { minHeight: '100vh', background: '#f5f5f5', fontFamily: "'DM Sans', sans-serif", paddingBottom: 40 },
  header:       { padding: '48px 20px 16px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  headerTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label:        { fontSize: 13, color: '#888', fontWeight: 500 },
  signOutBtn:   { background: 'transparent', border: '1px solid #e5e7eb', color: '#aaa', borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer' },
  balanceVal:   { fontSize: 36, fontWeight: 700, letterSpacing: -1 },
  balanceInput: { fontSize: 32, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '2px solid #7c3aed', color: '#1a1a1a', outline: 'none', width: 200 },
  tapHint:      { fontSize: 10, color: '#bbb' },
  pillRow:      { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  pill:         { borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 },
  pillDot:      { width: 6, height: 6, borderRadius: '50%' },
  pillName:     { fontSize: 11, color: '#555' },
  pillAmt:      { fontSize: 11, fontWeight: 600 },
  tabBar:       { display: 'flex', overflowX: 'auto', padding: '0 8px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', gap: 2, paddingTop: 6 },
  tabBtn:       { whiteSpace: 'nowrap', padding: '8px 14px', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontFamily: "'DM Sans', sans-serif" },
  addTabBtn:    { whiteSpace: 'nowrap', padding: '8px 14px', background: 'transparent', border: 'none', color: '#aaa', fontSize: 14, cursor: 'pointer', borderBottom: '2px solid transparent' },
  content:      { padding: '16px 16px 80px' },
  emptyState:   { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 },
  tabHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  addEntryBtn:  { border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff' },
  deleteTabBtn: { background: 'transparent', border: '1px solid #fecaca', color: '#f87171', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' },
  entryRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#ffffff', borderRadius: 12, marginBottom: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  entryLeft:    { display: 'flex', alignItems: 'center', gap: 10 },
  entrySign:    { fontSize: 18, fontWeight: 700, width: 16 },
  entryLabel:   { fontSize: 14, color: '#1a1a1a', fontWeight: 500 },
  entryDate:    { fontSize: 11, color: '#aaa', marginTop: 2 },
  entryAmt:     { fontSize: 15, fontWeight: 700 },
  delBtn:       { background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', zIndex: 100 },
  sheet:        { background: '#ffffff', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480, margin: '0 auto', paddingBottom: 40, boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' },
  sheetTitle:   { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 },
  fieldLabel:   { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  fieldInput:   { width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  typeBtn:      { flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  sheetBtn:     { width: '100%', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff' },
}