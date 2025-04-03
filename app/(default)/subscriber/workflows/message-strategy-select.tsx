import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface MessageStrategyProps {
  messageStrategy: string;
  messageCount: number;
  timeWindowValue: number;
  timeWindowUnit: string;
  onStrategyChange: (strategy: string) => void;
  onMessageCountChange: (count: number) => void;
  onTimeWindowValueChange: (value: number) => void;
  onTimeWindowUnitChange: (unit: string) => void;
}

export function MessageStrategySelect({
  messageStrategy,
  messageCount,
  timeWindowValue,
  timeWindowUnit,
  onStrategyChange,
  onMessageCountChange,
  onTimeWindowValueChange,
  onTimeWindowUnitChange
}: MessageStrategyProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="messageStrategy">Message Pulling Strategy</Label>
        <Select
          value={messageStrategy}
          onValueChange={(value) => onStrategyChange(value)}
        >
          <SelectTrigger id="messageStrategy">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest_n">Pull Latest N Messages</SelectItem>
            <SelectItem value="past_time">Pull Past Time Messages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {messageStrategy === 'latest_n' && (
        <div className="space-y-2">
          <Label htmlFor="messageCount">Message Count</Label>
          <Input
            id="messageCount"
            type="number"
            min={1}
            max={1000}
            value={messageCount}
            onChange={(e) => onMessageCountChange(parseInt(e.target.value, 10))}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Maximum number of messages to pull from each channel
          </p>
        </div>
      )}

      {messageStrategy === 'past_time' && (
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="timeWindowValue">Time Window</Label>
              <Input
                id="timeWindowValue"
                type="number"
                min={1}
                max={1000}
                value={timeWindowValue}
                onChange={(e) =>
                  onTimeWindowValueChange(parseInt(e.target.value, 10))
                }
              />
            </div>
            <div className="w-1/3">
              <Label htmlFor="timeWindowUnit">Unit</Label>
              <Select
                value={timeWindowUnit}
                onValueChange={onTimeWindowUnitChange}
              >
                <SelectTrigger id="timeWindowUnit">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pull messages from the past time period
          </p>
        </div>
      )}
    </div>
  );
}
