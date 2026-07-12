'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  QrCode,
  Phone,
  ChevronDown,
  Search,
  Smartphone,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCopy } from '@/lib/hooks/useCopy';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { BaseToolProps } from '@/lib/types/tools';
import { useToolStore } from '@/lib/store/toolStore';
import {
  buildWhatsAppLink,
  countryCodes,
  messageTemplates,
  cleanPhoneNumber,
  isValidPhoneNumber,
  formatPhoneForDisplay,
  type CountryCode,
  type WhatsAppLinkResult,
} from '@/lib/tools/whatsapp-link-generator';
import QRCode from 'qrcode';

interface WhatsAppLinkGeneratorProps extends BaseToolProps {}

export default function WhatsAppLinkGenerator({
  categoryColor,
  dictionary,
}: WhatsAppLinkGeneratorProps) {
  const ui = dictionary?.tools?.['whatsapp-link-generator']?.ui ?? {};
  const { copy } = useCopy();
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({
    onlyIfNotVisible: false,
  });

  // State
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<WhatsAppLinkResult | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = countryCodes.filter(
    (country) =>
      country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Generate QR code when result changes
  useEffect(() => {
    const generateQR = async () => {
      if (result?.success && result.url) {
        try {
          const qr = await QRCode.toDataURL(result.url, {
            width: 200,
            margin: 2,
            color: {
              dark: '#25D366',
              light: '#FFFFFF',
            },
          });
          setQrCodeUrl(qr);
        } catch {
          setQrCodeUrl(null);
        }
      } else {
        setQrCodeUrl(null);
      }
    };

    generateQR();
  }, [result]);

  // Generate WhatsApp link
  const handleGenerate = useCallback(() => {
    const startTime = Date.now();

    const generated = buildWhatsAppLink({
      countryCode: selectedCountry.dialCode,
      phoneNumber,
      message: message.trim() || undefined,
    });

    setResult(generated);

    if (generated.success && generated.url) {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'whatsapp-link-generator',
        input: `${selectedCountry.dialCode} ${phoneNumber}`,
        output: generated.url,
        timestamp: startTime,
      });

      scrollToResult();
    }
  }, [selectedCountry, phoneNumber, message, addToHistory, scrollToResult]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (result?.url) {
      copy(result.url);
    }
  }, [result, copy]);

  // Download QR code
  const handleDownloadQR = useCallback(() => {
    if (!qrCodeUrl) return;

    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `whatsapp-qr-${cleanPhoneNumber(phoneNumber)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [qrCodeUrl, phoneNumber]);

  // Download link as text file
  const handleDownload = useCallback(() => {
    if (!result?.url) return;

    const blob = new Blob([result.url], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-link.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  // Apply message template
  const applyTemplate = useCallback((templateText: string) => {
    setMessage(templateText);
    setShowTemplates(false);
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setPhoneNumber('');
    setMessage('');
    setResult(null);
    setQrCodeUrl(null);
  }, []);

  // Check if form is valid
  const isFormValid =
    phoneNumber.trim() && isValidPhoneNumber(cleanPhoneNumber(phoneNumber));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Phone Number Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {ui.phoneNumberTitle || 'Phone Number'}
          </CardTitle>
          <CardDescription>
            {ui.phoneNumberDescription || 'Enter the WhatsApp number you want to chat with'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {/* Country Code Selector */}
            <div ref={dropdownRef} className="relative">
              <Button
                variant="outline"
                className="w-[140px] justify-between"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.dialCode}</span>
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>

              {isCountryDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-md border bg-popover shadow-md">
                  <div className="p-2">
                    <div className="flex items-center gap-2 rounded-md border px-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={ui.searchCountryPlaceholder || 'Search country...'}
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="border-0 p-2 focus-visible:ring-0"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsCountryDropdownOpen(false);
                          setCountrySearch('');
                        }}
                        type="button"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="flex-1 text-sm">
                          {country.country}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {country.dialCode}
                        </span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        {ui.noCountriesFound || 'No countries found'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))
              }
              placeholder="333 1234567"
              className="flex-1 font-mono"
            />
          </div>

          {phoneNumber &&
            !isValidPhoneNumber(cleanPhoneNumber(phoneNumber)) && (
              <p className="text-sm text-destructive">
                {ui.invalidPhoneNumber || 'Please enter a valid phone number (6-15 digits)'}
              </p>
            )}

          <p className="text-xs text-muted-foreground">
            {ui.phoneNumberHint || 'Enter the phone number without leading zeros. The country code will be added automatically.'}
          </p>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {ui.prefilledMessageTitle || 'Pre-filled Message'}
              </CardTitle>
              <CardDescription>
                {ui.prefilledMessageDescription || 'Optional message that will be pre-filled in the chat'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {ui.templatesButton || 'Templates'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Templates */}
          {showTemplates && (
            <div className="space-y-4 rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium">{ui.messageTemplatesHeading || 'Message Templates'}</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs">{ui.businessLabel || 'Business'}</Label>
                  <div className="flex flex-col gap-1">
                    {Object.entries(messageTemplates.business).map(
                      ([key, text]) => (
                        <Button
                          key={key}
                          variant="ghost"
                          size="sm"
                          onClick={() => applyTemplate(text)}
                          className="justify-start text-xs"
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{ui.personalLabel || 'Personal'}</Label>
                  <div className="flex flex-col gap-1">
                    {Object.entries(messageTemplates.personal).map(
                      ([key, text]) => (
                        <Button
                          key={key}
                          variant="ghost"
                          size="sm"
                          onClick={() => applyTemplate(text)}
                          className="justify-start text-xs"
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{ui.marketingLabel || 'Marketing'}</Label>
                  <div className="flex flex-col gap-1">
                    {Object.entries(messageTemplates.marketing).map(
                      ([key, text]) => (
                        <Button
                          key={key}
                          variant="ghost"
                          size="sm"
                          onClick={() => applyTemplate(text)}
                          className="justify-start text-xs"
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={ui.messagePlaceholder || 'Hi! I would like to inquire about...'}
            rows={4}
            maxLength={4096}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{message.length} / 4096 {ui.characters || 'characters'}</span>
            {message && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessage('')}
                className="h-auto p-1 text-xs"
              >
                {ui.clearMessage || 'Clear message'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={!isFormValid} size="lg">
          <MessageCircle className="mr-2 h-5 w-5" />
          {ui.generateButton || 'Generate WhatsApp Link'}
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <Trash2 className="mr-2 h-4 w-4" />
          {ui.clearButton || 'Clear'}
        </Button>
      </div>

      {/* Result */}
      {result && result.success && (
        <div ref={resultRef}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                {ui.yourLinkTitle || 'Your WhatsApp Link'}
              </CardTitle>
              <CardDescription>
                {ui.yourLinkDescription || 'Share this link to start a conversation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Display */}
              <div className="space-y-2">
                <div className="break-all rounded-lg bg-muted p-4 font-mono text-sm">
                  {result.url}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    {ui.copyLink || 'Copy Link'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    {ui.download || 'Download'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(result.url, '_blank')}
                    className="bg-[#25D366] text-white hover:bg-[#128C7E]"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {ui.openWhatsApp || 'Open WhatsApp'}
                  </Button>
                </div>
              </div>

              {/* QR Code & Mobile Preview */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      {ui.qrCode || 'QR Code'}
                    </Label>
                    <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="WhatsApp QR Code"
                        className="h-48 w-48"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQR}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {ui.downloadQR || 'Download QR'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mobile Preview */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {ui.preview || 'Preview'}
                  </Label>
                  <div className="rounded-xl border-4 border-gray-800 bg-gray-100 p-3 dark:bg-gray-900">
                    {/* WhatsApp-style header */}
                    <div className="mb-2 flex items-center gap-3 rounded-t-lg bg-[#075E54] p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                        <Phone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {formatPhoneForDisplay(
                            selectedCountry.dialCode,
                            phoneNumber
                          )}
                        </p>
                        <p className="text-xs text-green-200">online</p>
                      </div>
                    </div>
                    {/* Message preview */}
                    <div className="min-h-[100px] rounded-b-lg bg-[#ECE5DD] p-3 dark:bg-[#0B141A]">
                      {message && (
                        <div className="ml-auto max-w-[80%] rounded-lg bg-[#DCF8C6] p-2 dark:bg-[#005C4B]">
                          <p className="text-sm text-gray-800 dark:text-white">
                            {message}
                          </p>
                          <p className="mt-1 text-right text-[10px] text-gray-500 dark:text-gray-400">
                            Now
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {result.metadata && (
                <Alert>
                  <AlertDescription className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {ui.fullNumber || 'Full Number:'}
                      </span>
                      <span className="font-mono">
                        +{result.metadata.fullPhoneNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {ui.messageIncluded || 'Message Included:'}
                      </span>
                      <Badge
                        variant={
                          result.metadata.hasMessage ? 'default' : 'secondary'
                        }
                      >
                        {result.metadata.hasMessage ? (ui.yes || 'Yes') : (ui.no || 'No')}
                      </Badge>
                    </div>
                    {result.metadata.hasMessage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {ui.messageLength || 'Message Length:'}
                        </span>
                        <span>{result.metadata.messageLength} {ui.chars || 'chars'}</span>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error */}
      {result && !result.success && (
        <Alert variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
