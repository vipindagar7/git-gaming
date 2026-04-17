'use client';
import { useRef, useEffect, useState } from 'react';

export default function OtpInput({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = value.padEnd(6, ' ').split('');
  const [boxSize, setBoxSize] = useState(48);

  // Dynamically shrink boxes on very narrow screens
  useEffect(() => {
    function calc() {
      const vw = window.innerWidth;
      if (vw <= 360) setBoxSize(36);
      else if (vw <= 480) setBoxSize(40);
      else setBoxSize(48);
    }
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

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

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  };

  return (
    <div style={{
      display: 'flex', gap: boxSize <= 36 ? 6 : 8,
      justifyContent: 'center', margin: '20px 0',
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          value={d.trim()}
          onChange={() => { }}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          maxLength={1}
          inputMode="numeric"
          style={{
            width: boxSize,
            height: boxSize + 8,
            textAlign: 'center',
            fontSize: boxSize <= 36 ? 18 : 22,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            border: '2px solid',
            borderColor: d.trim() ? '#00c9a7' : '#2a2a3a',
            borderRadius: 10,
            background: d.trim() ? 'rgba(0,201,167,0.08)' : '#16162a',
            color: d.trim() ? '#00c9a7' : '#8888aa',
            outline: 'none',
            transition: 'all 0.2s',
            cursor: 'text',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#00c9a7';
            e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = d.trim() ? '#00c9a7' : '#2a2a3a';
            e.target.style.boxShadow = 'none';
          }}
        />
      ))}
    </div>
  );
}