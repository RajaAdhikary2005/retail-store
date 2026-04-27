import { ShoppingCart } from 'lucide-react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 40%, #64748b 60%, #334155 100%)',
      border: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(15, 23, 42, 0.5)',
      flexShrink: 0
    }}>
      <ShoppingCart 
        color="#ffffff" 
        size={size * 0.52} 
        strokeWidth={2.5} 
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.4))' }} 
      />
    </div>
  );
}
