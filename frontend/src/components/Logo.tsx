import { ShoppingBag } from 'lucide-react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.max(6, size * 0.2),
      background: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)', // Professional deep slate to bright blue
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
      flexShrink: 0
    }}>
      <ShoppingBag color="#ffffff" size={size * 0.55} strokeWidth={2.5} />
    </div>
  );
}
