import {
  generateQRContent,
  generateTextContent,
  generateUrlContent,
  generateWifiContent,
  generateVCardContent,
  generateEmailContent,
  generateSmsContent,
  generateGeoContent,
  generateCryptoContent,
  validateQRContent,
  calculateReadabilityScore,
  generateQRCode,
  generateBatchQRCodes,
  qrTemplates,
  getQRCodeApiUrl,
  generateCurlCommand,
  type QRContentData,
  type QRGeneratorOptions,
  type BatchQRItem,
} from '../../../lib/tools/qr-generator';

describe('QR Generator Content Generation', () => {
  describe('generateTextContent', () => {
    it('should generate plain text content', () => {
      const data: QRContentData = { type: 'text', text: 'Hello World' };
      expect(generateTextContent(data)).toBe('Hello World');
    });

    it('should handle empty text', () => {
      const data: QRContentData = { type: 'text' };
      expect(generateTextContent(data)).toBe('');
    });
  });

  describe('generateUrlContent', () => {
    it('should add https protocol to URLs without protocol', () => {
      const data: QRContentData = { type: 'url', url: 'example.com' };
      expect(generateUrlContent(data)).toBe('https://example.com');
    });

    it('should preserve existing protocol', () => {
      const data: QRContentData = { type: 'url', url: 'https://example.com' };
      expect(generateUrlContent(data)).toBe('https://example.com');
    });

    it('should handle empty URL', () => {
      const data: QRContentData = { type: 'url' };
      expect(generateUrlContent(data)).toBe('');
    });

    it('should trim whitespace from URL', () => {
      const data: QRContentData = { type: 'url', url: '  example.com  ' };
      expect(generateUrlContent(data)).toBe('https://example.com');
    });
  });

  describe('generateWifiContent', () => {
    it('should generate WiFi QR content with WPA security', () => {
      const data: QRContentData = {
        type: 'wifi',
        ssid: 'MyNetwork',
        password: 'password123',
        security: 'WPA',
      };
      expect(generateWifiContent(data)).toBe(
        'WIFI:T:WPA;S:MyNetwork;P:password123;H:false;;'
      );
    });

    it('should handle hidden networks', () => {
      const data: QRContentData = {
        type: 'wifi',
        ssid: 'MyNetwork',
        password: 'password123',
        security: 'WPA',
        hidden: true,
      };
      expect(generateWifiContent(data)).toBe(
        'WIFI:T:WPA;S:MyNetwork;P:password123;H:true;;'
      );
    });

    it('should handle networks without password', () => {
      const data: QRContentData = {
        type: 'wifi',
        ssid: 'OpenNetwork',
        security: 'nopass',
      };
      expect(generateWifiContent(data)).toBe(
        'WIFI:T:nopass;S:OpenNetwork;P:;H:false;;'
      );
    });

    it('should handle missing SSID', () => {
      const data: QRContentData = { type: 'wifi' };
      expect(generateWifiContent(data)).toBe('');
    });
  });

  describe('generateVCardContent', () => {
    it('should generate complete vCard content', () => {
      const data: QRContentData = {
        type: 'vcard',
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Acme Corp',
        phone: '+1234567890',
        email: 'john@example.com',
        website: 'example.com',
      };

      const result = generateVCardContent(data);
      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('VERSION:3.0');
      expect(result).toContain('N:Doe,John');
      expect(result).toContain('FN:John Doe');
      expect(result).toContain('ORG:Acme Corp');
      expect(result).toContain('TEL:+1234567890');
      expect(result).toContain('EMAIL:john@example.com');
      expect(result).toContain('URL:https://example.com');
      expect(result).toContain('END:VCARD');
    });

    it('should handle minimal vCard with only first name', () => {
      const data: QRContentData = {
        type: 'vcard',
        firstName: 'John',
      };

      const result = generateVCardContent(data);
      expect(result).toContain('N:,John');
      expect(result).toContain('FN:John');
    });

    it('should add protocol to website URLs', () => {
      const data: QRContentData = {
        type: 'vcard',
        firstName: 'John',
        website: 'example.com',
      };

      const result = generateVCardContent(data);
      expect(result).toContain('URL:https://example.com');
    });
  });

  describe('generateEmailContent', () => {
    it('should generate email mailto URL', () => {
      const data: QRContentData = {
        type: 'email',
        emailTo: 'test@example.com',
      };
      expect(generateEmailContent(data)).toBe('mailto:test@example.com');
    });

    it('should include subject and body parameters', () => {
      const data: QRContentData = {
        type: 'email',
        emailTo: 'test@example.com',
        subject: 'Hello',
        body: 'How are you?',
      };
      const result = generateEmailContent(data);
      expect(result).toBe(
        'mailto:test@example.com?subject=Hello&body=How%20are%20you%3F'
      );
    });

    it('should handle empty email', () => {
      const data: QRContentData = { type: 'email' };
      expect(generateEmailContent(data)).toBe('');
    });
  });

  describe('generateSmsContent', () => {
    it('should generate SMS URL', () => {
      const data: QRContentData = {
        type: 'sms',
        phoneNumber: '+1234567890',
      };
      expect(generateSmsContent(data)).toBe('sms:+1234567890');
    });

    it('should include message body', () => {
      const data: QRContentData = {
        type: 'sms',
        phoneNumber: '+1234567890',
        message: 'Hello there!',
      };
      const result = generateSmsContent(data);
      expect(result).toBe('sms:+1234567890?body=Hello%20there!');
    });

    it('should handle empty phone number', () => {
      const data: QRContentData = { type: 'sms' };
      expect(generateSmsContent(data)).toBe('');
    });
  });

  describe('generateGeoContent', () => {
    it('should generate geo location URL', () => {
      const data: QRContentData = {
        type: 'geo',
        latitude: 40.7128,
        longitude: -74.006,
      };
      // Note: -74.006 is a number, so a trailing zero can't survive
      expect(generateGeoContent(data)).toBe('geo:40.7128,-74.006');
    });

    it('should handle missing coordinates', () => {
      const data: QRContentData = { type: 'geo' };
      expect(generateGeoContent(data)).toBe('');
    });

    it('should handle zero coordinates', () => {
      const data: QRContentData = {
        type: 'geo',
        latitude: 0,
        longitude: 0,
      };
      expect(generateGeoContent(data)).toBe('geo:0,0');
    });
  });

  describe('generateCryptoContent', () => {
    it('should generate Bitcoin URI', () => {
      const data: QRContentData = {
        type: 'crypto',
        cryptoType: 'bitcoin',
        cryptoAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      };
      expect(generateCryptoContent(data)).toBe(
        'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      );
    });

    it('should include amount and label', () => {
      const data: QRContentData = {
        type: 'crypto',
        cryptoType: 'bitcoin',
        cryptoAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: 0.001,
        label: 'Donation',
      };
      const result = generateCryptoContent(data);
      expect(result).toBe(
        'bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=0.001&label=Donation'
      );
    });

    it('should handle Ethereum addresses', () => {
      const data: QRContentData = {
        type: 'crypto',
        cryptoType: 'ethereum',
        cryptoAddress: '0x742d35Cc6634C0532925a3b8D1c9c9D4d1C4b3b3',
      };
      expect(generateCryptoContent(data)).toBe(
        'ethereum:0x742d35Cc6634C0532925a3b8D1c9c9D4d1C4b3b3'
      );
    });

    it('should handle empty address', () => {
      const data: QRContentData = { type: 'crypto' };
      expect(generateCryptoContent(data)).toBe('');
    });
  });

  describe('generateQRContent', () => {
    it('should route to correct content generator based on type', () => {
      const testCases = [
        { type: 'text' as const, text: 'Hello' },
        { type: 'url' as const, url: 'example.com' },
        { type: 'wifi' as const, ssid: 'Network' },
      ];

      testCases.forEach((data) => {
        const result = generateQRContent(data);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('QR Generator Validation', () => {
  describe('validateQRContent', () => {
    it('should validate text content', () => {
      const validData: QRContentData = { type: 'text', text: 'Hello' };
      const result = validateQRContent(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty text content', () => {
      const invalidData: QRContentData = { type: 'text' };
      const result = validateQRContent(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Text content is required');
    });

    it('should validate URL format', () => {
      const validData: QRContentData = {
        type: 'url',
        url: 'https://example.com',
      };
      const result = validateQRContent(validData);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const invalidData: QRContentData = { type: 'url', url: 'not-a-url' };
      const result = validateQRContent(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should validate email format', () => {
      const validData: QRContentData = {
        type: 'email',
        emailTo: 'test@example.com',
      };
      const result = validateQRContent(validData);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData: QRContentData = {
        type: 'email',
        emailTo: 'invalid-email',
      };
      const result = validateQRContent(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email address format');
    });

    it('should validate geo coordinates', () => {
      const validData: QRContentData = {
        type: 'geo',
        latitude: 40.7128,
        longitude: -74.006,
      };
      const result = validateQRContent(validData);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const invalidData: QRContentData = {
        type: 'geo',
        latitude: 91,
        longitude: 0,
      };
      const result = validateQRContent(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Latitude must be between -90 and 90');
    });

    it('should reject invalid longitude', () => {
      const invalidData: QRContentData = {
        type: 'geo',
        latitude: 0,
        longitude: 181,
      };
      const result = validateQRContent(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Longitude must be between -180 and 180');
    });
  });
});

describe('QR Generator Readability', () => {
  describe('calculateReadabilityScore', () => {
    it('should give high score for optimal settings', () => {
      const content = 'https://example.com';
      const options: QRGeneratorOptions = {
        size: 256,
        errorCorrectionLevel: 'medium',
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
      };
      const score = calculateReadabilityScore(content, options);
      expect(score).toBeGreaterThan(90);
    });

    it('should penalize long content', () => {
      const shortContent = 'Short';
      const longContent = 'A'.repeat(600);
      const options: QRGeneratorOptions = { size: 256 };

      const shortScore = calculateReadabilityScore(shortContent, options);
      const longScore = calculateReadabilityScore(longContent, options);

      expect(shortScore).toBeGreaterThan(longScore);
    });

    it('should penalize small sizes', () => {
      const content = 'Test';
      const largeOptions: QRGeneratorOptions = { size: 512 };
      const smallOptions: QRGeneratorOptions = { size: 64 };

      const largeScore = calculateReadabilityScore(content, largeOptions);
      const smallScore = calculateReadabilityScore(content, smallOptions);

      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it('should penalize same foreground and background colors', () => {
      const content = 'Test';
      const goodOptions: QRGeneratorOptions = {
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
      };
      const badOptions: QRGeneratorOptions = {
        foregroundColor: '#808080',
        backgroundColor: '#808080',
      };

      const goodScore = calculateReadabilityScore(content, goodOptions);
      const badScore = calculateReadabilityScore(content, badOptions);

      expect(goodScore).toBeGreaterThan(badScore);
    });

    it('should penalize large logos', () => {
      const content = 'Test';
      const noLogoOptions: QRGeneratorOptions = {};
      const largeLogoOptions: QRGeneratorOptions = {
        logoImage: 'data:image/png;base64,iVBOR...',
        logoSize: 35,
      };

      const noLogoScore = calculateReadabilityScore(content, noLogoOptions);
      const largeLogoScore = calculateReadabilityScore(
        content,
        largeLogoOptions
      );

      expect(noLogoScore).toBeGreaterThan(largeLogoScore);
    });
  });
});

describe('QR Generator API', () => {
  describe('generateQRCode', () => {
    it('should generate QR code for valid content', async () => {
      const contentData: QRContentData = {
        type: 'text',
        text: 'Hello World',
      };
      const options: QRGeneratorOptions = {
        size: 256,
        format: 'png',
      };

      const result = await generateQRCode(contentData, options);

      expect(result.success).toBe(true);
      expect(result.qrCode).toBeDefined();
      expect(result.format).toBe('png');
      expect(result.size).toEqual({ width: 256, height: 256 });
      expect(result.readabilityScore).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.contentLength).toBe(11);
    }, 10000);

    it('should return error for invalid content', async () => {
      const contentData: QRContentData = {
        type: 'text',
        // Missing required text field
      };

      const result = await generateQRCode(contentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate SVG format', async () => {
      const contentData: QRContentData = {
        type: 'text',
        text: 'Test',
      };
      const options: QRGeneratorOptions = {
        format: 'svg',
      };

      const result = await generateQRCode(contentData, options);

      expect(result.success).toBe(true);
      expect(result.qrCode).toContain('<svg');
      expect(result.qrCode).toContain('</svg>');
    }, 10000);

    it('should generate base64 format', async () => {
      const contentData: QRContentData = {
        type: 'text',
        text: 'Test',
      };
      const options: QRGeneratorOptions = {
        format: 'base64',
      };

      const result = await generateQRCode(contentData, options);

      expect(result.success).toBe(true);
      expect(result.qrCode).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern
    }, 10000);

    it('should include warnings for problematic settings', async () => {
      const contentData: QRContentData = {
        type: 'text',
        text: 'A'.repeat(400), // Very long content
      };
      const options: QRGeneratorOptions = {
        size: 64, // Very small size
      };

      const result = await generateQRCode(contentData, options);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('generateBatchQRCodes', () => {
    it('should generate multiple QR codes', async () => {
      const items: BatchQRItem[] = [
        {
          id: '1',
          content: { type: 'text', text: 'First' },
          options: { format: 'png' },
        },
        {
          id: '2',
          content: { type: 'text', text: 'Second' },
          options: { format: 'svg' },
        },
      ];

      const result = await generateBatchQRCodes(items);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.totalGenerated).toBe(2);
      expect(result.errors).toBe(0);

      expect(result.results[0].qrCode).toBeDefined();
      expect(result.results[1].qrCode).toBeDefined();
    }, 15000);

    it('should handle mixed valid and invalid items', async () => {
      const items: BatchQRItem[] = [
        {
          id: '1',
          content: { type: 'text', text: 'Valid' },
          options: { format: 'png' },
        },
        {
          id: '2',
          content: { type: 'text' }, // Invalid - no text
          options: { format: 'png' },
        },
      ];

      const result = await generateBatchQRCodes(items);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.totalGenerated).toBe(1);
      expect(result.errors).toBe(1);

      expect(result.results[0].qrCode).toBeDefined();
      expect(result.results[1].error).toBeDefined();
    }, 15000);
  });
});

describe('QR Generator Templates', () => {
  describe('qrTemplates', () => {
    it('should provide WiFi home template', () => {
      const template = qrTemplates.wifiHome();
      expect(template.type).toBe('wifi');
      expect(template.ssid).toBe('Home-WiFi');
      expect(template.security).toBe('WPA');
    });

    it('should provide social media templates', () => {
      const instagram = qrTemplates.instagramProfile('username');
      expect(instagram.type).toBe('url');
      expect(instagram.url).toBe('https://instagram.com/username');

      const linkedin = qrTemplates.linkedinProfile('username');
      expect(linkedin.type).toBe('url');
      expect(linkedin.url).toBe('https://linkedin.com/in/username');
    });

    it('should provide business card template', () => {
      const businessCard = qrTemplates.businessCard();
      expect(businessCard.type).toBe('vcard');
      expect(businessCard.firstName).toBe('John');
      expect(businessCard.lastName).toBe('Doe');
    });

    it('should provide development templates', () => {
      const localhost = qrTemplates.localhost();
      expect(localhost.type).toBe('url');
      expect(localhost.url).toBe('http://localhost:3000');

      const localhostCustom = qrTemplates.localhost(8080);
      expect(localhostCustom.url).toBe('http://localhost:8080');

      const api = qrTemplates.apiEndpoint('/users');
      expect(api.type).toBe('url');
      expect(api.url).toBe('https://api.example.com/users');
    });
  });
});

describe('QR Generator Utilities', () => {
  describe('getQRCodeApiUrl', () => {
    it('should generate API URL with correct parameters', () => {
      const content: QRContentData = { type: 'text', text: 'Hello' };
      const options: QRGeneratorOptions = {
        size: 256,
        errorCorrectionLevel: 'medium',
        foregroundColor: '#FF0000',
        backgroundColor: '#00FF00',
      };

      const url = getQRCodeApiUrl(content, options);

      expect(url).toContain('qrserver.com');
      expect(url).toContain('data=Hello');
      expect(url).toContain('size=256x256');
      expect(url).toContain('ecc=M');
      expect(url).toContain('color=FF0000');
      expect(url).toContain('bgcolor=00FF00');
    });
  });

  describe('generateCurlCommand', () => {
    it('should generate curl command with correct parameters', () => {
      const content: QRContentData = { type: 'text', text: 'Test' };
      const options: QRGeneratorOptions = { format: 'png' };

      const curl = generateCurlCommand(content, options);

      expect(curl.startsWith('curl -o qrcode.png')).toBe(true);
      expect(curl).toContain('qrserver.com');
      expect(curl).toContain('data=Test');
    });
  });
});

// Edge cases and error handling
describe('QR Generator Edge Cases', () => {
  it('should handle empty content gracefully', async () => {
    const contentData: QRContentData = { type: 'text', text: '' };
    const result = await generateQRCode(contentData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle very long content', async () => {
    const contentData: QRContentData = {
      type: 'text',
      text: 'A'.repeat(3000), // Very long content
    };

    const result = await generateQRCode(contentData);

    // Should still succeed but with warnings
    expect(result.success).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings?.length).toBeGreaterThan(0);
  }, 15000);

  it('should handle special characters in content', async () => {
    const contentData: QRContentData = {
      type: 'text',
      text: '🔥 Special chars: äöü ñ 中文 русский',
    };

    const result = await generateQRCode(contentData);
    expect(result.success).toBe(true);
  }, 10000);

  it('should validate URL with unusual protocols', () => {
    const ftpData: QRContentData = {
      type: 'url',
      url: 'ftp://files.example.com',
    };
    const validation = validateQRContent(ftpData);
    expect(validation.valid).toBe(true);

    const fileData: QRContentData = {
      type: 'url',
      url: 'file:///path/to/file',
    };
    const fileValidation = validateQRContent(fileData);
    expect(fileValidation.valid).toBe(true);
  });
});
