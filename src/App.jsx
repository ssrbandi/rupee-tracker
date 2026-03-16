import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase/config'
import LoginScreen from './screens/LoginScreen'
import SetupScreen from './screens/SetupScreen'
import HomeScreen from './screens/HomeScreen'

export default function App() {
  const [user, setUser]       = useState(null)
  const [userName, setUserName] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        // Check if user has a name set
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists() && snap.data().name) {
          setUserName(snap.data().name)
        }
      } else {
        setUser(null)
        setUserName(null)
      }
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

  if (!user) return <LoginScreen />
  if (!userName) return <SetupScreen user={user} onComplete={setUserName} />
  return <HomeScreen user={user} userName={userName} />
}