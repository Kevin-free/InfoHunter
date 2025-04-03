import { useState, useEffect } from 'react';
import { MessageStrategySelect } from './message-strategy-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PromptInput } from './prompt-input';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface WorkflowFormProps {
  initialData?: {
    name?: string;
    prompt?: string;
    refreshIntervalHours?: number;
    messageStrategy?: string;
    messageCount?: number;
    timeWindowValue?: number;
    timeWindowUnit?: string;
    isPrivate?: boolean;
  };
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function WorkflowForm({
  initialData,
  onSubmit,
  isSubmitting
}: WorkflowFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [refreshIntervalHours, setRefreshIntervalHours] = useState(
    initialData?.refreshIntervalHours || 0
  );
  const [messageStrategy, setMessageStrategy] = useState(
    initialData?.messageStrategy || 'latest_n'
  );
  const [messageCount, setMessageCount] = useState(
    initialData?.messageCount || 100
  );
  const [timeWindowValue, setTimeWindowValue] = useState(
    initialData?.timeWindowValue || 24
  );
  const [timeWindowUnit, setTimeWindowUnit] = useState(
    initialData?.timeWindowUnit || 'hours'
  );
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form whenever required fields change
  useEffect(() => {
    setIsFormValid(!!name && !!prompt);
  }, [name, prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onSubmit({
      name,
      prompt,
      refreshIntervalHours,
      messageStrategy,
      messageCount,
      timeWindowValue,
      timeWindowUnit,
      isPrivate
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <PromptInput value={prompt} onChange={(value) => setPrompt(value)} />

      <div className="space-y-2">
        <Label htmlFor="refreshInterval">Refresh Interval (hours)</Label>
        <Input
          id="refreshInterval"
          type="number"
          min="0"
          value={refreshIntervalHours}
          onChange={(e) => setRefreshIntervalHours(Number(e.target.value))}
        />
      </div>

      {/* Privacy setting */}
      <div className="flex items-center justify-between space-x-2 pt-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="isPrivate" className="font-medium">
            Make workflow private
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Private workflows are only visible to you and won't be shown
                  on channel pages.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="isPrivate"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
        />
      </div>

      {/* Message strategy selection */}
      <div className="mt-4">
        <MessageStrategySelect
          messageStrategy={messageStrategy}
          messageCount={messageCount}
          timeWindowValue={timeWindowValue}
          timeWindowUnit={timeWindowUnit}
          onStrategyChange={setMessageStrategy}
          onMessageCountChange={setMessageCount}
          onTimeWindowValueChange={setTimeWindowValue}
          onTimeWindowUnitChange={setTimeWindowUnit}
        />
      </div>

      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="w-full mt-4"
      >
        {isSubmitting
          ? initialData?.name
            ? 'Updating...'
            : 'Creating...'
          : initialData?.name
            ? 'Update Workflow'
            : 'Create Workflow'}
      </Button>
    </form>
  );
}
