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
          WebkitAppearance: 'none',
          touchAction: 'manipulation',
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
                width: 48, height: 2, margin: '0 6px',
                background: done ? '#00c9a7' : '#2a2a3a',
                marginBottom: 22, transition: 'background .3s',
                flexShrink: 0,
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', contact: '', altContact: '', type: 'student' });
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', ok: true });
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

      showToast('Registration successful!');
      setTimeout(() => {
        router.replace('https://docs.google.com/forms/d/e/1FAIpQLSdrQB8ABsKtAYTJjbACGtrtzwU3D2ZmAIJEsMkScQhL9k88nw/viewform');
      }, 1000);
    } catch {
      showToast('Network error', false);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0); setForm({ name: '', contact: '', altContact: '', type: 'student' });
    setOtp(''); setTimer(0); setToast({ msg: '', ok: true });
  }

  const primaryBtn = {
    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #00c9a7, #00a085)',
    color: '#0a0a14', fontSize: 15, fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
    fontFamily: 'var(--font-syne)', letterSpacing: '0.03em',
    marginTop: 8, transition: 'opacity .2s, transform .1s',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    minHeight: 48,
  };
  const ghostBtn = {
    ...primaryBtn, background: 'transparent',
    border: '2px solid #2a2a3a', color: '#6666aa',
  };

  return (
    <div>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

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
        .btn-primary:active:not(:disabled) { transform: translateY(0) !important; }
        .btn-ghost:hover:not(:disabled) { border-color: #00c9a7 !important; color: #00c9a7 !important; }

        input::placeholder { color: #3a3a5a; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a14; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }

        /* ── Card ── */
        .reg-card {
          width: 100%;
          max-width: 440px;
          background: #0e0e1c;
          border: 1px solid #1e1e30;
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }

        /* ── Brand ── */
        .brand-wrap {
          margin-bottom: 28px;
          text-align: center;
          width: 100%;
          max-width: 440px;
          padding: 0 4px;
        }
        .brand-title {
          color: #e8e8f0;
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        /* ── Type radio grid ── */
        .type-grid {
          display: flex;
          gap: 12px;
        }
        .type-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 13px 6px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all .2s;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          min-height: 48px;
        }

        /* ── Success detail rows ── */
        .detail-row {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        /* ════════════════════════════
           BREAKPOINTS
        ════════════════════════════ */

        /* Tiny phones ≤ 360px */
        @media (max-width: 360px) {
          .reg-card { padding: 22px 14px; border-radius: 14px; }
          .brand-title { font-size: 15px; }
          .type-grid { gap: 6px; }
          .type-option { font-size: 12px; padding: 10px 4px; }
          .outer-wrap { padding: 20px 0 36px !important; }
          .brand-wrap { padding: 0 14px; }
        }

        /* Small phones 361–480px */
        @media (min-width: 361px) and (max-width: 480px) {
          .reg-card {
            padding: 26px 18px;
            border-radius: 0;
            border-left: none;
            border-right: none;
            max-width: 100%;
          }
          .outer-wrap { padding: 28px 0 40px !important; align-items: flex-start !important; }
          .brand-wrap { padding: 0 18px; max-width: 100%; }
          .brand-title { font-size: 18px; }
        }

        /* Mid phones 481–600px */
        @media (min-width: 481px) and (max-width: 600px) {
          .reg-card {
            padding: 30px 24px;
            border-radius: 16px;
            max-width: 100%;
            margin: 0 16px;
          }
          .outer-wrap { padding: 30px 0 40px !important; align-items: flex-start !important; }
          .brand-wrap { max-width: 100%; padding: 0 16px; }
          .brand-title { font-size: 19px; }
        }

        /* Tablets 601–900px */
        @media (min-width: 601px) and (max-width: 900px) {
          .reg-card { padding: 32px 28px; }
          .brand-title { font-size: 20px; }
        }

        /* Large screens */
        @media (min-width: 1200px) {
          .reg-card { max-width: 480px; padding: 40px 36px; }
          .brand-wrap { max-width: 480px; }
        }
      `}</style>
      <div
        className="outer-wrap"
        style={{
          minHeight: '100vh',
          background: '#0a0a14',
          backgroundImage:
            'radial-gradient(ellipse at 20% 50%, rgba(0,201,167,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(100,60,200,0.06) 0%, transparent 60%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 12px',
          fontFamily: 'var(--font-syne)',
        }}
      >

        {/* ── Brand ── */}
        <div className="brand-wrap" style={{ textAlign: 'center', width: '100%', maxWidth: 500 }}>

          {/* Logo Container */}
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#00c9a7,#00a085)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              padding: '12px 10px',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          >
            <div className="flex items-around w-[100%] justify-around gap-4 sm:gap-6 md:gap-8 flex-wrap">

              {/* EIT Logo */}
              <span className="bg-white rounded-lg p-2 flex items-center justify-center">
                <Image
                  src="/Black-Logo.webp"
                  alt="EIT Logo"
                  width={96}
                  height={64}
                  className="w-12 sm:w-16 md:w-20 h-auto object-contain"
                  priority
                />
              </span>

              {/* GGSIPU Logo */}
              <span className="bg-white rounded-lg p-2 flex items-center justify-center">
                <Image
                  src="/GGSIPU-Black.png"
                  alt="GGSIPU Logo"
                  width={96}
                  height={64}
                  className="w-12 sm:w-16 md:w-20 h-auto object-contain"
                />
              </span>

            </div>
          </div>

          {/* Title */}
          <h1
            className="brand-title"
            style={{
              color: '#e8e8f0',
              fontSize: 'clamp(18px, 4vw, 24px)',
              fontWeight: 800,
              margin: 0,
            }}
          >
            Echelon Institute of Technology
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: '#4a4a6a',
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              margin: '4px 0 0',
              fontFamily: 'var(--font-mono)',
            }}
          >
            OTP-verified registration
          </p>

        </div>

        {/* ── Card ── */}
        <div key={step} className="reg-card card-animate">

          <Steps current={step} />

          {/* Toast */}
          {toast.msg && (
            <div style={{
              background: toast.ok ? 'rgba(0,201,167,0.08)' : 'rgba(255,80,80,0.08)',
              color: toast.ok ? '#00c9a7' : '#ff6060',
              border: `1px solid ${toast.ok ? 'rgba(0,201,167,0.25)' : 'rgba(255,80,80,0.25)'}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
              marginBottom: 20, fontFamily: 'var(--font-mono)', lineHeight: 1.5,
              animation: 'fadeUp .25s ease both', wordBreak: 'break-word',
            }}>
              {toast.ok ? '✓ ' : '✗ '}{toast.msg}
            </div>
          )}

          {/* ═══ STEP 0 : Form ═══════════════════════════════════════════════ */}
          {step === 0 && (
            <form onSubmit={sendOtp} noValidate>
              <Field label="Full Name *" placeholder="e.g. Rahul Sharma"
                value={form.name} onChange={set('name')} autoComplete="name" />
              <Field label="Contact Number *" placeholder="10-digit mobile number"
                value={form.contact} onChange={set('contact')} maxLength={10}
                inputMode="numeric" type="tel" autoComplete="tel" />
              <Field label="Alternate Contact" placeholder="Optional"
                value={form.altContact} onChange={set('altContact')} maxLength={10}
                inputMode="numeric" type="tel" />

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#5a5a7a', marginBottom: 10,
                  fontFamily: 'var(--font-mono)',
                }}>
                  Type *
                </label>
                <div className="type-grid">
                  {[
                    { val: 'student', icon: '🎓', label: 'Student' },
                    { val: 'other', icon: '👤', label: 'Other' },
                  ].map(({ val, icon, label }) => (
                    <label
                      key={val}
                      className="type-option"
                      style={{
                        border: `2px solid ${form.type === val ? '#00c9a7' : '#2a2a3a'}`,
                        background: form.type === val ? 'rgba(0,201,167,0.06)' : '#0e0e1c',
                        color: form.type === val ? '#00c9a7' : '#5a5a7a',
                      }}
                    >
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
            <form onSubmit={verifyAndRegister} noValidate>
              <p style={{ textAlign: 'center', color: '#5a5a7a', fontSize: 14, margin: '0 0 4px', fontFamily: 'var(--font-mono)' }}>
                Enter the 6-digit code sent to
              </p>
              <p style={{ textAlign: 'center', color: '#00c9a7', fontSize: 16, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
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
                  <div key={k} className="detail-row">
                    <span style={{ color: '#4a4a6a', minWidth: 90, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: '#00c9a7', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>

              <button style={primaryBtn} className="btn-primary" onClick={reset}>
                + Register Another
              </button>
            </div>
          )}
        </div>
      </div >
    </div>


  );
}