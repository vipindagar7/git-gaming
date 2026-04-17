'use client';
import { useRef } from 'react';

export default function OtpInput({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = value.padEnd(6, ' ').split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i === 0 ? 0 : i - 1) + value.slice(i);
      onChange(next.replace(/ /g, '').slice(0, 6));
      if (i > 0) refs[i - 1].current.focus();
    } else if (/^\d$/.test(e.key)) {
      const arr = value.padEnd(6, ' ').split('');
      arr[i] = e.key;
      const next = arr.join('').replace(/ /g, '');
      onChange(next.slice(0, 6));
      if (i < 5) refs[i + 1].current.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          value={d.trim()}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          maxLength={1}
          inputMode="numeric"
          style={{
            width: 48, height: 56, textAlign: 'center',
            fontSize: 24, fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            border: '2px solid',
            borderColor: d.trim() ? '#00c9a7' : '#2a2a3a',
            borderRadius: 12,
            background: d.trim() ? 'rgba(0,201,167,0.08)' : '#16162a',
            color: d.trim() ? '#00c9a7' : '#8888aa',
            outline: 'none',
            transition: 'all 0.2s',
            cursor: 'text',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.15)'; }}
          onBlur={(e) => { e.target.style.borderColor = d.trim() ? '#00c9a7' : '#2a2a3a'; e.target.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}