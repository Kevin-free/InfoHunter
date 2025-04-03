'use client';

import { useEffect, useState } from 'react';
import { CONTACT_EMAIL } from '@/lib/constants/plans';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Mail } from 'lucide-react';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [email] = useState(CONTACT_EMAIL);

  useEffect(() => {
    // 重置复制状态
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{
        backgroundImage: "url('/assets/mail-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh'
      }}
    >
      <div className="bg-card rounded-lg shadow-lg p-8 flex items-center gap-8 max-w-4xl mx-auto">
        <img
          src="/assets/mail.png"
          alt="Contact illustration"
          width={260}
          height={241}
          className="hidden md:block"
        />
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Enterprise Workflow Package</h1>
          <p className="text-muted-foreground">
            Thank you for your interest in our Enterprise solution. Please
            contact our sales team for customized pricing and features.
          </p>

          <div className="space-y-2">
            <div className="text-sm font-medium">Contact Email</div>
            <div className="flex items-center gap-2">
              <div className="bg-muted px-4 py-2 rounded-md flex-1 font-mono">
                {email}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyEmail}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* <div className="flex gap-4">
            <Button
              className="w-full"
              onClick={() =>
                (window.location.href = `mailto:${email}?subject=Enterprise%20Workflow%20Package%20Inquiry`)
              }
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.close()}
            >
              Close
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
