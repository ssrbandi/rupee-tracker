import { useState } from 'react'
import { auth } from '../firebase/config'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth'

export default function LoginScreen() {
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [step, setStep]       = useState('phone')
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { size: 'invisible' }
      )
    }
  }

  const sendOTP = async () => {
    setError('')
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      setupRecaptcha()
      const phoneNumber = `+91${phone}`
      const confirmation = await signInWithPhoneNumber(
        auth, phoneNumber, window.recaptchaVerifier
      )
      setConfirm(confirmation)
      setStep('otp')
    } catch (err) {
      setError('Failed to send OTP. Try again.')
      console.error(err)
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    setError('')
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      await confirm.confirm(otp)
    } catch (err) {
      setError('Invalid OTP. Try again.')
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.icon}>₹</div>
        <h1 style={s.title}>Rupee Tracker</h1>
        <p style={s.subtitle}>Your money. Your control.</p>

        {step === 'phone' ? (
          <>
            <div style={s.inputGroup}>
              <span style={s.prefix}>+91</span>
              <input
                style={s.input}
                type="tel"
                placeholder="98765 43210"
                value={phone}
                maxLength={10}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
                autoFocus
              />
            </div>
            <button
              style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
              onClick={sendOTP}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p style={s.hint}>OTP sent to +91 {phone}</p>
            <input
              style={s.otpInput}
              type="number"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              autoFocus
            />
            <button
              style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
              onClick={verifyOTP}
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button
              style={s.backBtn}
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError('')
              }}
            >
              ← Change number
            </button>
          </>
        )}

        {error && <p style={s.error}>{error}</p>}
        <div id="recaptcha-container" />
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
  subtitle: { fontSize: 13, color: '#888', margin: 0 },
  hint:     { fontSize: 12, color: '#888', margin: 0 },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    background: '#ffffff0d',
    border: '1px solid #ffffff15',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%'
  },
  prefix: {
    padding: '12px 10px 12px 14px',
    color: '#888',
    fontSize: 14,
    borderRight: '1px solid #ffffff15'
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '12px 14px',
    color: '#fff',
    fontSize: 16,
    outline: 'none',
    letterSpacing: 1
  },
  otpInput: {
    width: '100%',
    background: '#ffffff0d',
    border: '1px solid #ffffff15',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
    outline: 'none',
    letterSpacing: 10,
    fontWeight: 700
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
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: 13,
    cursor: 'pointer'
  },
  error: { color: '#fca5a5', fontSize: 12, margin: 0 }
}