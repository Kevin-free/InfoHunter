'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getJwt } from '@/components/lib/networkUtils';
interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function PromptInput({
  value,
  onChange,
  label = 'Prompt'
}: PromptInputProps) {
  const [promptMode, setPromptMode] = useState<'manual' | 'ai'>('manual');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrompt = async () => {
    if (!value) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-workflow-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        },
        body: JSON.stringify({
          prompt: value
        })
      });

      if (response.status === 402) {
        toast.error(`Insufficient credits! Please buy credits.`);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      onChange(data.prompt);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate prompt'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="prompt">{label}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={promptMode === 'manual' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setPromptMode('manual')}
          >
            Manual
          </Button>
          <Button
            type="button"
            variant={promptMode === 'ai' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setPromptMode('ai')}
          >
            AI Generate
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Textarea
          id="prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[100px] resize-y"
          required
        />
        {promptMode === 'ai' && (
          <Button
            type="button"
            onClick={handleGeneratePrompt}
            disabled={isGenerating || !value}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Prompt'}
          </Button>
        )}
      </div>
    </div>
  );
}
