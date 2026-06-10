import { ImageResponse } from 'next/og';
import { getToolById, categories } from '@/lib/tools';

export const runtime = 'edge';
export const revalidate = 86400; // Cache for 24h - tool data only changes on deploy
export const alt = 'ToolsLab Tool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface OpenGraphImageProps {
  params: { tool: string };
}

export default async function Image({ params }: OpenGraphImageProps) {
  const tool = getToolById(params.tool);

  if (!tool) {
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div style={{ fontSize: '120px', marginBottom: '24px' }}>❌</div>
        <div style={{ fontSize: '48px', fontWeight: '800' }}>
          Tool Not Found
        </div>
        <div style={{ fontSize: '24px', marginTop: '16px', opacity: 0.8 }}>
          ToolsLab - Developer Tools
        </div>
      </div>,
      { ...size }
    );
  }

  // Get primary category for color scheme
  const primaryCategory = categories.find(
    (cat) => cat.id === tool.categories[0]
  );

  // Category color mapping
  const categoryColors = {
    data: { primary: '#3B82F6', secondary: '#1E40AF' },
    encoding: { primary: '#10B981', secondary: '#047857' },
    text: { primary: '#8B5CF6', secondary: '#7C3AED' },
    generators: { primary: '#F59E0B', secondary: '#D97706' },
    web: { primary: '#EC4899', secondary: '#BE185D' },
    dev: { primary: '#EF4444', secondary: '#DC2626' },
    formatters: { primary: '#6366F1', secondary: '#4F46E5' },
  };

  const colors =
    categoryColors[tool.categories[0] as keyof typeof categoryColors] ||
    categoryColors.data;

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        fontFamily: 'system-ui',
        color: 'white',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '32px' }}>🧪</div>
        <div style={{ fontSize: '20px', fontWeight: '700' }}>ToolsLab</div>
      </div>

      <div style={{ fontSize: '120px', marginBottom: '24px' }}>{tool.icon}</div>
      <div
        style={{
          fontSize: '56px',
          fontWeight: '800',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        {tool.name}
      </div>
      <div
        style={{
          fontSize: '20px',
          marginBottom: '24px',
          textAlign: 'center',
          maxWidth: '800px',
        }}
      >
        {tool.description}
      </div>

      {primaryCategory && (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '12px 20px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '20px' }}>{primaryCategory.icon}</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>
            {primaryCategory.name}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          gap: '30px',
          fontSize: '16px',
          opacity: 0.8,
        }}
      >
        <div>🚀 Fast & Free</div>
        <div>🔒 Secure</div>
        <div>📱 Works Offline</div>
      </div>
    </div>,
    { ...size }
  );
}
