'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MODEL_OPTIONS } from '@/lib/constants/models';

interface ModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ModelSelect({ value, onValueChange }: ModelSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // 过滤模型列表
  const filteredModels = MODEL_OPTIONS.filter((model) =>
    model.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedModel = MODEL_OPTIONS.find((model) => model.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedModel?.label || 'Select model...'}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command>
          <CommandInput
            placeholder="Search models..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {filteredModels.map((model) => (
                <CommandItem
                  key={model.value}
                  onSelect={() => {
                    onValueChange(model.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === model.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {model.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
