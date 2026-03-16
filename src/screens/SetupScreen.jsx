import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function SetupScreen({ user, onComplete }) {
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter your name'); return }
    setLoading(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        phone: user.phoneNumber,
        totalBalance: 0,
        createdAt: Date.now()
      })
      onComplete(name.trim())
    } catch (err) {
      setError('Something went wrong. Try again.')
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.icon}>₹</div>
        <h1 style={s.title}>Welcome!</h1>
        <p style={s.subtitle}>What should we call you?</p>

        <input
          autoFocus
          style={s.input}
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />

        {error && <p style={s.error}>{error}</p>}

        <button
          style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving…' : "Let's go →"}
        </button>

        <p style={s.phone}>{user.phoneNumber}</p>
      </div>
    </div>
  )
}

const s = {
  container: {
    minHeight: '100vh',
    background: '#0f0f13',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    background: '#16161f',
    border: '1px solid #ffffff12',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14
  },
  icon: {
    width: 64, height: 64,
    background: '#a78bfa22',
    border: '1px solid #a78bfa44',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#a78bfa'
  },
  title:    { fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },
  input: {
    width: '100%',
    background: '#ffffff0d',
    border: '1px solid #ffffff15',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box'
  },
  btn: {
    width: '100%',
    background: '#a78bfa',
    border: 'none',
    borderRadius: 12,
    padding: 14,
    color: '#000',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer'
  },
  phone: { fontSize: 11, color: '#444', margin: 0 },
  error: { color: '#fca5a5', fontSize: 12, margin: 0 }
}