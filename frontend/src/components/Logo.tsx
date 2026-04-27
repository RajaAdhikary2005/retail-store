

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 40%, #94a3b8 60%, #475569 100%)', // Lighter metallic silver
      border: '1.5px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(15, 23, 42, 0.4)',
      flexShrink: 0
    }}>
      <svg 
        width={size * 0.6} // Larger icon
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="3" // Thicker strokes for premium look
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.4))' }}
      >
        <path d="M6 6h15l-1.5 9h-11L6 6z" />
        <path d="M2 2h4l2 11" />
        <circle cx="9" cy="20" r="1" fill="#ffffff" stroke="none" />
        <circle cx="18" cy="20" r="1" fill="#ffffff" stroke="none" />
      </svg>
    </div>
  );
}
