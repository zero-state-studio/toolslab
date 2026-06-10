import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 86400; // Cache for 24h
export const alt = 'ToolsLab - Laboratory for Developer Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
        color: 'white',
      }}
    >
      <div style={{ fontSize: '120px', marginBottom: '24px' }}>🧪</div>
      <div
        style={{ fontSize: '72px', fontWeight: '800', marginBottom: '16px' }}
      >
        ToolsLab
      </div>
      <div style={{ fontSize: '32px', fontWeight: '500' }}>
        Laboratory for Developer Tools
      </div>
    </div>,
    {
      ...size,
    }
  );
}
