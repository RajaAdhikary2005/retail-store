import { ShoppingCart } from 'lucide-react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%', // Circle shape
      background: 'linear-gradient(135deg, #94a3b8 0%, #334155 100%)', // Sleek silver to metallic slate grey
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(51, 65, 85, 0.25)', // Slate shadow
      flexShrink: 0
    }}>
      <ShoppingCart color="#ffffff" size={size * 0.55} strokeWidth={2.5} />
    </div>
  );
}
