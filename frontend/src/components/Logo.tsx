import { ShoppingCart } from 'lucide-react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%', // Circular
      background: 'linear-gradient(135deg, #0f172a 0%, #06b6d4 100%)', // Midnight Blue to Electric Cyan
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(6, 182, 212, 0.3)', // Cyan shadow
      flexShrink: 0
    }}>
      <ShoppingCart color="#ffffff" size={size * 0.55} strokeWidth={2.5} />
    </div>
  );
}
