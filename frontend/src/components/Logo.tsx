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
      background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)', // Emerald Green to Bright Teal
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', // Emerald shadow
      flexShrink: 0
    }}>
      <ShoppingCart color="#ffffff" size={size * 0.55} strokeWidth={2.5} />
    </div>
  );
}
