'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import OtpInput from '@/components/OtpInput';
import Image from 'next/image';

const isValidPhone = (v) => /^\d{10}$/.test(v);

// ── Reusable styled input ────────────────────────────────────────────────────
function Field({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: focused ? '#00c9a7' : '#5a5a7a',
        marginBottom: 7, transition: 'color .2s', fontFamily: 'var(--font-mono)',
      }}>
        {label}
      </label>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: 10,
          border: `2px solid ${focused ? '#00c9a7' : '#2a2a3a'}`,
          background: focused ? 'rgba(0,201,167,0.04)' : '#0e0e1c',
          color: '#e8e8f0', fontSize: 15, outline: 'none',
          boxSizing: 'border-box', fontFamily: 'var(--font-syne)',
          transition: 'border-color .2s, background .2s',
          boxShadow: focused ? '0 0 0 4px rgba(0,201,167,0.08)' : 'none',
        }}
      />
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Details', 'Verify', 'Done'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#00c9a7' : active ? 'transparent' : '#16162a',
                border: `2px solid ${done || active ? '#00c9a7' : '#2a2a3a'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: done ? '#0a0a14' : active ? '#00c9a7' : '#3a3a5a',
                transition: 'all .3s', fontFamily: 'var(--font-mono)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? '#00c9a7' : done ? '#00c9a7aa' : '#3a3a5a',
                fontFamily: 'var(--font-mono)',
              }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 60, height: 2, margin: '0 8px',
                background: done ? '#00c9a7' : '#2a2a3a',
                marginBottom: 22, transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0); // 0=form, 1=otp, 2=success
  const [form, setForm] = useState({ name: '', contact: '', altContact: '', type: 'student' });
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', ok: true });
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const timerRef = useRef(null);
  const router = useRouter();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 5000);
  };

  useEffect(() => {
    if (timer > 0) timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  // ── Send OTP ──────────────────────────────────────────────────────────────
  async function sendOtp(e) {
    e?.preventDefault();
    if (!form.name.trim()) return showToast('Name is required', false);
    if (!isValidPhone(form.contact)) return showToast('Enter a valid 10-digit contact number', false);
    if (form.altContact && !isValidPhone(form.altContact))
      return showToast('Alternate contact must also be 10 digits', false);

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) return showToast(data.message, false);
      showToast(`OTP sent to ${form.contact}${data.otp_dev ? ' | DEV OTP: ' + data.otp_dev : ''}`);
      setStep(1); setTimer(60);
    } catch {
      showToast('Network error — is MongoDB running?', false);
    } finally {
      setLoading(false);
    }
  }

  // ── Verify + Register ─────────────────────────────────────────────────────
  async function verifyAndRegister(e) {
    e?.preventDefault();
    if (otp.length !== 6) return showToast('Enter the complete 6-digit OTP', false);
    setLoading(true);
    try {
      const vRes = await fetch('/api/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: form.contact, otp }),
      });
      const vData = await vRes.json();
      if (!vData.success) return showToast(vData.message, false);

      const rRes = await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const rData = await rRes.json();
      if (!rData.success) return showToast(rData.message, false);
      ' '
      showToast('Registration successful!');

      // small delay so user sees success
      setTimeout(() => {
        router.replace('https://docs.google.com/forms/d/e/1FAIpQLSdrQB8ABsKtAYTJjbACGtrtzwU3D2ZmAIJEsMkScQhL9k88nw/viewform');   // your page
      }, 1000);
      '===='
    } catch {
      showToast('Network error', false);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0); setForm({ name: '', contact: '', altContact: '', type: 'student' });
    setOtp(''); setTimer(0); setToast({ msg: '', ok: true }); setShowUsers(false);
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const primaryBtn = {
    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #00c9a7, #00a085)',
    color: '#0a0a14', fontSize: 15, fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
    fontFamily: 'var(--font-syne)', letterSpacing: '0.03em',
    marginTop: 8, transition: 'opacity .2s, transform .1s',
  };
  const ghostBtn = {
    ...primaryBtn, background: 'transparent',
    border: '2px solid #2a2a3a', color: '#6666aa',
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,201,167,0.3); }
          50%       { box-shadow: 0 0 0 12px rgba(0,201,167,0); }
        }
        .card-animate { animation: fadeUp 0.4s ease both; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
        .btn-ghost:hover:not(:disabled) { border-color: #00c9a7; color: #00c9a7; }
        input::placeholder { color: #3a3a5a; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a14; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0a0a14',
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,201,167,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(100,60,200,0.06) 0%, transparent 60%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 16px', fontFamily: 'var(--font-syne)',
      }}>

        {/* Logo / Brand */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            width: 104, height: 84, borderRadius: 14,
            background: 'linear-gradient(135deg,#00c9a7,#00a085)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 12px',
            animation: 'pulse 3s ease-in-out infinite',
          }}>
            <Image src="/Black-Logo.webp" alt="EIT Logo" width={84} height={64} />


          </div>
          <h1 style={{ color: '#e8e8f0', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Echelon Institute of Technology
          </h1>
          <p style={{ color: '#4a4a6a', fontSize: 13, margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
            OTP-verified registration
          </p>
        </div>

        {/* Card */}
        <div
          key={step}
          className="card-animate"
          style={{
            width: '100%', maxWidth: 440,
            background: '#0e0e1c',
            border: '1px solid #1e1e30',
            borderRadius: 20,
            padding: '36px 32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
        >
          <Steps current={step} />

          {/* Toast */}
          {toast.msg && (
            <div style={{
              background: toast.ok ? 'rgba(0,201,167,0.08)' : 'rgba(255,80,80,0.08)',
              color: toast.ok ? '#00c9a7' : '#ff6060',
              border: `1px solid ${toast.ok ? 'rgba(0,201,167,0.25)' : 'rgba(255,80,80,0.25)'}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
              marginBottom: 20, fontFamily: 'var(--font-mono)', lineHeight: 1.5,
              animation: 'fadeUp .25s ease both',
            }}>
              {toast.ok ? '✓ ' : '✗ '}{toast.msg}
            </div>
          )}

          {/* ═══ STEP 0 : Form ═══════════════════════════════════════════════ */}
          {step === 0 && (
            <form onSubmit={sendOtp}>
              <Field label="Full Name *" placeholder="e.g. Rahul Sharma"
                value={form.name} onChange={set('name')} />
              <Field label="Contact Number *" placeholder="10-digit mobile number"
                value={form.contact} onChange={set('contact')} maxLength={10} inputMode="numeric" />
              <Field label="Alternate Contact" placeholder="Optional"
                value={form.altContact} onChange={set('altContact')} maxLength={10} inputMode="numeric" />

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#5a5a7a', marginBottom: 10,
                  fontFamily: 'var(--font-mono)',
                }}>
                  Type *
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { val: 'student', icon: '🎓', label: 'Student' },
                    { val: 'other', icon: '👤', label: 'Other' },
                  ].map(({ val, icon, label }) => (
                    <label key={val} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '13px 0', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${form.type === val ? '#00c9a7' : '#2a2a3a'}`,
                      background: form.type === val ? 'rgba(0,201,167,0.06)' : '#0e0e1c',
                      color: form.type === val ? '#00c9a7' : '#5a5a7a',
                      fontWeight: 600, fontSize: 14, transition: 'all .2s',
                    }}>
                      <input type="radio" name="type" value={val}
                        checked={form.type === val} onChange={set('type')}
                        style={{ display: 'none' }} />
                      {icon} {label}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" style={primaryBtn} className="btn-primary" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Continue →'}
              </button>
            </form>
          )}

          {/* ═══ STEP 1 : OTP ════════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={verifyAndRegister}>
              <p style={{ textAlign: 'center', color: '#5a5a7a', fontSize: 14, margin: '0 0 4px', fontFamily: 'var(--font-mono)' }}>
                Enter the 6-digit code sent to
              </p>
              <p style={{ textAlign: 'center', color: '#00c9a7', fontSize: 16, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-mono)' }}>
                +91 {form.contact}
              </p>

              <OtpInput value={otp} onChange={setOtp} />

              <button type="submit" style={primaryBtn} className="btn-primary"
                disabled={loading || otp.length < 6}>
                {loading ? 'Verifying…' : 'Verify & Register'}
              </button>

              <button type="button" className="btn-ghost" style={{ ...ghostBtn, marginTop: 10 }}
                disabled={timer > 0}
                onClick={async () => { setOtp(''); await sendOtp(); }}>
                {timer > 0 ? `Resend OTP in ${timer}s` : '↺ Resend OTP'}
              </button>

              <button type="button" className="btn-ghost" style={{ ...ghostBtn, marginTop: 10 }}
                onClick={reset}>
                ← Back
              </button>
            </form>
          )}

          {/* ═══ STEP 2 : Success ════════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12, animation: 'pulse 2s ease-in-out infinite' }}>✅</div>
              <h2 style={{ color: '#e8e8f0', margin: '0 0 6px', fontWeight: 800 }}>Registered!</h2>
              <p style={{ color: '#5a5a7a', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 24 }}>
                Your details have been saved securely.
              </p>

              <div style={{
                background: '#0a0a14', border: '1px solid #1e1e30',
                borderRadius: 12, padding: '16px 20px', textAlign: 'left',
                marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 13,
              }}>
                {[
                  ['Name', form.name],
                  ['Contact', form.contact],
                  ...(form.altContact ? [['Alt Contact', form.altContact]] : []),
                  ['Type', form.type === 'student' ? '🎓 Student' : '👤 Other'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <span style={{ color: '#4a4a6a', minWidth: 90 }}>{k}</span>
                    <span style={{ color: '#00c9a7' }}>{v}</span>
                  </div>
                ))}
              </div>
              { }
              <button style={primaryBtn} className="btn-primary" onClick={reset}>
                + Register Another
              </button>

            </div>
          )}
        </div>

      </div>
    </>
  );
}