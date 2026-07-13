"use client";

import { useId } from "react";

interface PasswordEyeProps {
  /** true = password sedang terlihat (tampilkan ikon "eye-off") */
  show: boolean;
  className?: string;
}

/**
 * Ikon mata untuk toggle password.
 * - Stroke menggunakan linear gradient (gradasi brand) → "gradasi perbatasan".
 * - Ukuran responsif via clamp() → proporsional di mobile, tablet, & desktop.
 * - Light-mode only (warna biru brand, tanpa varian dark).
 * - Gradient ID unik per instance (useId) → aman dirender berkali-kali di satu halaman.
 */
export function PasswordEye({ show, className = "" }: PasswordEyeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `eyeGrad-${uid}`;
  const stroke = `url(#${gradientId})`;

  const sizeStyle: React.CSSProperties = {
    width: "clamp(18px, 4.5vw, 22px)",
    height: "clamp(18px, 4.5vw, 22px)",
    flexShrink: 0,
    display: "block",
  };

  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={sizeStyle}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7ab4e0" />
          <stop offset="55%" stopColor="#3a7bc8" />
          <stop offset="100%" stopColor="#2a5a7a" />
        </linearGradient>
      </defs>

      {show ? (
        /* Eye-off: password terlihat -> klik untuk sembunyikan */
        <>
          <path
            d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
            {...common}
          />
          <path
            d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
            {...common}
          />
          <path
            d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
            {...common}
          />
          <line x1="2" y1="2" x2="22" y2="22" {...common} />
        </>
      ) : (
        /* Eye: password tersembunyi -> klik untuk tampilkan */
        <>
          <path
            d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
            {...common}
          />
          <circle cx="12" cy="12" r="3" {...common} />
        </>
      )}
    </svg>
  );
}
