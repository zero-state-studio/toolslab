import { ImageResponse } from 'next/og';
import { getPopularTools } from '@/lib/tools';

export const runtime = 'edge';
export const revalidate = 86400; // Cache for 24h
export const alt = 'ToolsLab - Laboratory for Developer Tools';
export const size = { width: 1200, height: 600 }; // Twitter card dimensions
export const contentType = 'image/png';

export default async function Image() {
  const popularTools = getPopularTools().slice(0, 5); // Fewer tools for smaller space

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        fontFamily: 'system-ui',
        position: 'relative',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
              radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0),
              radial-gradient(circle at 75px 75px, rgba(255,255,255,0.05) 2px, transparent 0)
            `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 1,
          gap: '20px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: '100px',
            marginBottom: '-10px',
          }}
        >
          🧪
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: '800',
            color: 'white',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            marginBottom: '8px',
            letterSpacing: '-2px',
          }}
        >
          ToolsLab
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            marginBottom: '30px',
          }}
        >
          Laboratory for Developer Tools
        </div>

        {/* Popular Tools Icons */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {popularTools.map((tool, index) => (
            <div
              key={tool.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                minWidth: '100px',
              }}
            >
              <div
                style={{
                  fontSize: '30px',
                }}
              >
                {tool.icon}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                {tool.name.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Text */}
        <div
          style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '500',
            marginTop: '15px',
          }}
        >
          Free • Secure • No Registration Required
        </div>
      </div>

      {/* Corner Accents - adjusted for smaller height */}
      <div
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}
      />
    </div>,
    {
      ...size,
    }
  );
}
