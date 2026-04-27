import { Layers } from 'lucide-react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.max(8, size * 0.25), // Sleek Squircle
      background: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', // Midnight Violet to Vibrant Purple
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)', // Purple shadow
      flexShrink: 0
    }}>
      <Layers color="#ffffff" size={size * 0.55} strokeWidth={2.5} />
    </div>
  );
}
