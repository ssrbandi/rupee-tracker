import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function HomeScreen({ user }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f13',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      gap: 12
    }}>
      <div style={{
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
      }}>₹</div>
      <h2 style={{ color: '#fff', margin: 0 }}>Rupee Tracker</h2>
      <p style={{ color: '#888', fontSize: 13 }}>
        {user.phoneNumber}
      </p>
      <button
        onClick={() => signOut(auth)}
        style={{
          background: 'transparent',
          border: '1px solid #ffffff20',
          color: '#888',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 13
        }}
      >
        Sign out
      </button>
    </div>
  )
}