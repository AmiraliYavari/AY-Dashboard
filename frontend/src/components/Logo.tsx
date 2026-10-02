import { useState } from 'react';

/**
 * Brand logo. Loads /logo.png from the /public folder.
 * To use your own logo, replace frontend/public/logo.png (or change LOGO_SRC).
 */
export const LOGO_SRC = '/logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`logo-fallback ${className}`} style={{ width: size, height: size }} aria-hidden="true">
        آ
      </span>
    );
  }
  return (
    <img
      className={`logo-img ${className}`}
      src={LOGO_SRC}
      width={size}
      height={size}
      alt="AY-Dashboard"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}