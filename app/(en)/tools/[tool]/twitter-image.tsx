import { ImageResponse } from 'next/og';
import { getToolById, categories } from '@/lib/tools';

export const runtime = 'edge';
export const revalidate = 86400; // Cache for 24h - tool data only changes on deploy
export const alt = 'ToolsLab Tool';
export const size = { width: 1200, height: 600 }; // Twitter card dimensions
export const contentType = 'image/png';

interface TwitterImageProps {
  params: { tool: string };
}

export default async function Image({ params }: TwitterImageProps) {
  const tool = getToolById(params.tool);

  if (!tool) {
    // Fallback image for non-existent tools
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
        <div style={{ fontSize: '100px', marginBottom: '24px' }}>🧪</div>
        <div style={{ fontSize: '42px', fontWeight: '800' }}>
          Tool Not Found
        </div>
        <div style={{ fontSize: '20px', marginTop: '16px', opacity: 0.8 }}>
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
  const categoryName = primaryCategory?.name || 'Tools';

  // Category color mapping (same as OpenGraph)
  const categoryColors = {
    data: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#DBEAFE' },
    encoding: { primary: '#10B981', secondary: '#047857', accent: '#D1FAE5' },
    text: { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#E9D5FF' },
    generators: { primary: '#F59E0B', secondary: '#D97706', accent: '#FEF3C7' },
    web: { primary: '#EC4899', secondary: '#BE185D', accent: '#FCE7F3' },
    dev: { primary: '#EF4444', secondary: '#DC2626', accent: '#FEE2E2' },
    formatters: { primary: '#6366F1', secondary: '#4F46E5', accent: '#E0E7FF' },
  };

  const colors =
    categoryColors[tool.categories[0] as keyof typeof categoryColors] ||
    categoryColors.data;

  // Get label badge info
  const getLabelInfo = (label: string) => {
    switch (label) {
      case 'new':
        return { text: 'NEW', bg: '#10B981', color: 'white' };
      case 'popular':
        return { text: 'POPULAR', bg: '#F59E0B', color: 'white' };
      case 'test':
        return { text: 'BETA', bg: '#8B5CF6', color: 'white' };
      case 'coming-soon':
        return { text: 'SOON', bg: '#6B7280', color: 'white' };
      default:
        return null;
    }
  };

  const labelInfo = getLabelInfo(tool.label || '');

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
        position: 'relative',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
              radial-gradient(circle at 150px 150px, rgba(255,255,255,0.1) 2px, transparent 0),
              radial-gradient(circle at 300px 300px, rgba(255,255,255,0.05) 2px, transparent 0)
            `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Header with ToolsLab branding */}
      <div
        style={{
          position: 'absolute',
          top: '30px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '28px' }}>🧪</div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          ToolsLab
        </div>
      </div>

      {/* Label Badge */}
      {labelInfo && (
        <div
          style={{
            position: 'absolute',
            top: '30px',
            right: '40px',
            backgroundColor: labelInfo.bg,
            color: labelInfo.color,
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '700',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {labelInfo.text}
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 1,
          maxWidth: '800px',
          padding: '0 40px',
        }}
      >
        {/* Tool Icon */}
        <div
          style={{
            fontSize: '100px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))',
          }}
        >
          {tool.icon}
        </div>

        {/* Tool Name */}
        <div
          style={{
            fontSize: tool.name.length > 20 ? '42px' : '56px',
            fontWeight: '800',
            color: 'white',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            marginBottom: '12px',
            letterSpacing: '-1px',
            lineHeight: '1.1',
          }}
        >
          {tool.name}
        </div>

        {/* Tool Description */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            marginBottom: '24px',
            lineHeight: '1.3',
            maxWidth: '700px',
          }}
        >
          {tool.description}
        </div>

        {/* Category and Features */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Category Badge */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '16px' }}>{primaryCategory?.icon}</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
              }}
            >
              {categoryName}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Features - adjusted for smaller height */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '40px',
          right: '40px',
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontWeight: '500',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div>🚀</div>
          <div>Fast & Free</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div>🔒</div>
          <div>Secure</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div>📱</div>
          <div>Works Offline</div>
        </div>
      </div>

      {/* Decorative Elements - adjusted for smaller height */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          right: '150px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '90px',
          left: '80px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
        }}
      />
    </div>,
    { ...size }
  );
}
