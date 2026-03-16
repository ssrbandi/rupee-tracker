import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'

export default function App() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f13',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ color: '#a78bfa', fontSize: 13 }}>Loading…</div>
    </div>
  )

  return user ? <HomeScreen user={user} /> : <LoginScreen />
}