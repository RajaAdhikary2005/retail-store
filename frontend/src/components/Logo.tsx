interface LogoProps {
  size?: number;
}

const LOGO_SRC = '/cart-logo-reference.png';

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="RetailStore logo"
    >
      <img
        src={LOGO_SRC}
        alt="RetailStore logo"
        width={size}
        height={size}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

