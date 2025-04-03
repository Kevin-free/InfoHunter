'use client';

import * as React from 'react';
import { CalendarDate } from '@internationalized/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerWithRangeProps {
  value: {
    from: CalendarDate | undefined;
    to: CalendarDate | undefined;
  };
  onChange: (value: {
    from: CalendarDate | undefined;
    to: CalendarDate | undefined;
  }) => void;
}

export function DatePickerWithRange({
  value,
  onChange
}: DatePickerWithRangeProps) {
  // Convert CalendarDate to JavaScript Date for display
  const formatDate = (date: CalendarDate | undefined) => {
    if (!date) return '';
    const jsDate = new Date(date.toString());
    return format(jsDate, 'MMM dd, yyyy');
  };

  // Simplified version that uses a standard calendar instead of a date range
  // You might need to adapt this to use a proper date range component depending on your UI library
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value.from ? (
            value.to ? (
              <>
                {formatDate(value.from)} - {formatDate(value.to)}
              </>
            ) : (
              formatDate(value.from)
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: value.from ? new Date(value.from.toString()) : undefined,
            to: value.to ? new Date(value.to.toString()) : undefined
          }}
          onSelect={(range: { from?: Date; to?: Date } | undefined) => {
            if (!range) return;
            onChange({
              from: range.from
                ? new CalendarDate(
                    range.from.getFullYear(),
                    range.from.getMonth() + 1,
                    range.from.getDate()
                  )
                : undefined,
              to: range.to
                ? new CalendarDate(
                    range.to.getFullYear(),
                    range.to.getMonth() + 1,
                    range.to.getDate()
                  )
                : undefined
            });
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
