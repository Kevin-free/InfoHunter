'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

interface ContactFormProps {
  email: string;
  copyText: string;
  copiedText: string;
  copyFailedText: string;
}

export function ContactForm({
  email,
  copyText,
  copiedText,
  copyFailedText
}: ContactFormProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(copyFailedText, err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Email</div>
      <div className="flex items-center gap-2">
        <div className="bg-muted px-4 py-2 rounded-md flex-1 font-mono">
          {email}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title={copied ? copiedText : copyText}
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
