

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      aria-label="RetailStore logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="coinOuter" cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#d7dbe2" />
            <stop offset="70%" stopColor="#9da5b2" />
            <stop offset="100%" stopColor="#586273" />
          </radialGradient>
          <radialGradient id="coinInner" cx="34%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#f7f9fc" />
            <stop offset="48%" stopColor="#cfd5de" />
            <stop offset="80%" stopColor="#8e98a8" />
            <stop offset="100%" stopColor="#525c6d" />
          </radialGradient>
          <linearGradient id="cartStroke" x1="25%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef2f7" />
          </linearGradient>
          <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodColor="#09101a" floodOpacity="0.38" />
          </filter>
          <filter id="iconShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.4" floodColor="#16212f" floodOpacity="0.6" />
          </filter>
          <clipPath id="coinClip">
            <circle cx="50" cy="50" r="44.5" />
          </clipPath>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#coinOuter)" stroke="#2b3442" strokeWidth="1.6" filter="url(#coinShadow)" />
        <circle cx="50" cy="50" r="44.5" fill="url(#coinInner)" stroke="#d9dee6" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#fafcff" strokeOpacity="0.55" strokeWidth="0.9" />
        <circle cx="50" cy="50" r="40.5" fill="none" stroke="#3f4a5c" strokeOpacity="0.4" strokeWidth="0.7" />

        <g clipPath="url(#coinClip)">
          <line x1="14" y1="50" x2="86" y2="50" stroke="#f8fbff" strokeOpacity="0.3" strokeWidth="1.1" />
          <line x1="50" y1="14" x2="50" y2="86" stroke="#f8fbff" strokeOpacity="0.25" strokeWidth="1.1" />
          <line x1="25" y1="25" x2="75" y2="75" stroke="#f8fbff" strokeOpacity="0.2" strokeWidth="1" />
          <line x1="75" y1="25" x2="25" y2="75" stroke="#f8fbff" strokeOpacity="0.2" strokeWidth="1" />
        </g>

        <g
          fill="none"
          stroke="url(#cartStroke)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#iconShadow)"
        >
          <path d="M22 34h10l5.5 22" />
          <path d="M39 38h38l-3.8 18H43z" />
          <path d="M50 38l1.1 18" />
          <path d="M60 38l0.2 18" />
          <path d="M70 38l-1 18" />
          <path d="M43 47h30" />
          <path d="M38 60h41" />
        </g>

        <circle cx="48" cy="69.5" r="4.5" fill="#ffffff" stroke="#182535" strokeWidth="1.1" />
        <circle cx="73" cy="69.5" r="4.5" fill="#ffffff" stroke="#182535" strokeWidth="1.1" />
      </svg>
    </div>
  );
}
