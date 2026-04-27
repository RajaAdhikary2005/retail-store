
import { useId } from 'react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const outerRing = `outerRing-${uid}`;
  const innerCoin = `innerCoin-${uid}`;
  const iconStroke = `iconStroke-${uid}`;
  const coinShadow = `coinShadow-${uid}`;
  const iconShadow = `iconShadow-${uid}`;
  const wheelShadow = `wheelShadow-${uid}`;
  const clipId = `coinClip-${uid}`;
  const rays = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    return {
      x2: 50 + Math.cos(angle) * 41.2,
      y2: 50 + Math.sin(angle) * 41.2,
    };
  });

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
          <linearGradient id={outerRing} x1="18%" y1="14%" x2="82%" y2="86%">
            <stop offset="0%" stopColor="#f7f8fb" />
            <stop offset="35%" stopColor="#b0b7c2" />
            <stop offset="72%" stopColor="#808997" />
            <stop offset="100%" stopColor="#424d5e" />
          </linearGradient>

          <radialGradient id={innerCoin} cx="35%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="42%" stopColor="#d8dde4" />
            <stop offset="76%" stopColor="#a4acb8" />
            <stop offset="100%" stopColor="#677282" />
          </radialGradient>

          <linearGradient id={iconStroke} x1="20%" y1="0%" x2="84%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eceff4" />
          </linearGradient>

          <filter id={coinShadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.8" floodColor="#050a12" floodOpacity="0.4" />
          </filter>

          <filter id={iconShadow} x="-25%" y="-25%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.7" stdDeviation="1.5" floodColor="#111722" floodOpacity="0.62" />
          </filter>

          <filter id={wheelShadow} x="-25%" y="-25%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#0f1825" floodOpacity="0.5" />
          </filter>

          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="41.5" />
          </clipPath>
        </defs>

        <circle cx="50" cy="50" r="48.6" fill="#1a2230" filter={`url(#${coinShadow})`} />
        <circle cx="50" cy="50" r="46.8" fill={`url(#${outerRing})`} stroke="#2d3748" strokeWidth="1.1" />
        <circle cx="50" cy="50" r="42.4" fill={`url(#${innerCoin})`} />
        <circle cx="50" cy="50" r="42.1" fill="none" stroke="#f7f9fc" strokeOpacity="0.55" strokeWidth="0.95" />
        <circle cx="50" cy="50" r="38.8" fill="none" stroke="#5a6473" strokeOpacity="0.35" strokeWidth="0.85" />

        <g clipPath={`url(#${clipId})`}>
          {rays.map((ray, index) => (
            <line
              key={index}
              x1="50"
              y1="50"
              x2={ray.x2}
              y2={ray.y2}
              stroke="#f2f5fa"
              strokeOpacity="0.2"
              strokeWidth="0.9"
            />
          ))}
        </g>
        <ellipse cx="41" cy="28" rx="22" ry="10" fill="#ffffff" fillOpacity="0.22" />

        <g
          fill="none"
          stroke={`url(#${iconStroke})`}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${iconShadow})`}
        >
          <path d="M12.7 24.4l3.1 3.7" />
          <path d="M15.8 28.1h8.1l5.4 20.3" />
          <path d="M29.4 34.1h47.9l-5.3 21.3H35.8z" />
          <path d="M35.8 45.2h37.9" />
          <path d="M41.8 34.1l2.2 21.3" />
          <path d="M54.1 34.1l1.1 21.3" />
          <path d="M66.5 34.1l-1.2 21.3" />
          <path d="M33.2 59.2h41.7" />
        </g>

        <g filter={`url(#${wheelShadow})`}>
          <circle cx="37.3" cy="71.1" r="5.2" fill="#ffffff" />
          <circle cx="37.3" cy="71.1" r="2.1" fill="#647082" />
          <circle cx="62.4" cy="71.1" r="5.2" fill="#ffffff" />
          <circle cx="62.4" cy="71.1" r="2.1" fill="#647082" />
        </g>
      </svg>
    </div>
  );
}
