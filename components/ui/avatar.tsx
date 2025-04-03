'use client';

import Image from 'next/image';
import { getR2ImageUrl } from '@/lib/r2';
import { useEffect, useState } from 'react';
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

interface GroupAvatarProps {
  photo?: string;
  name: string;
  size?: number;
  is_r2_url?: boolean;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export function GroupAvatar({
  photo,
  name,
  size = 32,
  is_r2_url = false
}: GroupAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string>(
    is_r2_url ? '' : photo || ''
  );

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    async function loadR2Url() {
      if (photo && is_r2_url) {
        const url = await getR2ImageUrl(photo);
        setImageUrl(url);
      }
    }
    loadR2Url();
  }, [photo, is_r2_url]);

  if (photo) {
    return (
      <div
        className="relative rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted text-muted-foreground"
      style={{ width: size, height: size }}
    >
      <span className="text-xs font-medium">{initials}</span>
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
