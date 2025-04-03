'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getJwt } from '@/components/lib/networkUtils';
import { useUserStore } from 'stores/userStore';
import { XCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface BasicInfoPanelProps {
  user: any;
}

export function BasicInfoPanel({ user }: BasicInfoPanelProps) {
  const [username, setUsername] = useState(user?.userKey || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const setUser = useUserStore((state) => state.setUser);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_USERNAME_LENGTH = 4;

  // 用户名输入处理
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    // 重置状态
    setUsernameAvailable(null);

    // 长度检查
    if (newUsername.trim().length === 0) {
      setUsernameError(null);
      return;
    } else if (newUsername.trim().length < MIN_USERNAME_LENGTH) {
      setUsernameError(
        `Username must be at least ${MIN_USERNAME_LENGTH} characters long`
      );
      return;
    } else {
      setUsernameError(null);
    }

    // 清除之前的超时
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // 设置新的超时 - 用户停止输入500ms后再检查
    checkTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(newUsername);
    }, 500);
  };

  // 组件卸载时清除超时
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const checkUsernameAvailability = async (
    usernameToCheck: string
  ): Promise<void> => {
    if (
      !usernameToCheck.trim() ||
      usernameToCheck.trim().length < MIN_USERNAME_LENGTH
    ) {
      return;
    }

    setIsCheckingUsername(true);
    try {
      const token = getJwt();
      const response = await fetch(
        `/api/user/check-username?username=${encodeURIComponent(usernameToCheck.trim())}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUpdateUsername = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      toast.error('Username cannot be empty');
      return;
    }

    if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
      toast.error(
        `Username must be at least ${MIN_USERNAME_LENGTH} characters long`
      );
      return;
    }

    if (!usernameAvailable) {
      toast.error('Username is already taken. Please choose another one.');
      return;
    }

    setIsUpdating(true);
    try {
      const token = getJwt();
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.userId,
          username: trimmedUsername
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update username');
      }

      const data = await response.json();

      // 更新本地用户状态
      setUser({
        ...user,
        userKey: trimmedUsername
      });
      toast.success('Username updated successfully');
    } catch (error) {
      console.error('Error updating username:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update username');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getUserInitials = (userKey: string) => {
    return userKey.substring(0, 2).toUpperCase();
  };

  // 判断是否显示用户名反馈UI
  const showUsernameFeedback =
    username.trim() !== user?.userKey &&
    username.trim().length >= MIN_USERNAME_LENGTH;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Manage your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoUrl} alt={user?.displayName || ''} />
            <AvatarFallback className="text-lg">
              {user?.userKey ? getUserInitials(user.userKey) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Profile Photo</p>
            <p className="text-sm">
              Your profile photo is managed by your authentication provider.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Email</div>
          <Input
            disabled
            value={user?.email || ''}
            className="w-full md:w-2/3"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Username</div>
          <div className="flex gap-3 items-center">
            <div className="relative w-full md:w-2/3">
              <Input
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter your username"
                className={`pr-10 ${
                  usernameError
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : usernameAvailable === true && showUsernameFeedback
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                }`}
              />
              {isCheckingUsername && showUsernameFeedback && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                </div>
              )}
              {!isCheckingUsername &&
                usernameAvailable === false &&
                showUsernameFeedback && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              {!isCheckingUsername &&
                usernameAvailable === true &&
                showUsernameFeedback && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
            </div>
            <Button
              onClick={handleUpdateUsername}
              disabled={
                isUpdating ||
                isCheckingUsername ||
                username === user?.userKey ||
                !username.trim() ||
                !!usernameError ||
                usernameAvailable !== true
              }
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {usernameError ? (
            <p className="text-xs text-red-500">{usernameError}</p>
          ) : !isCheckingUsername &&
            usernameAvailable === false &&
            showUsernameFeedback ? (
            <p className="text-xs text-red-500">
              That username has been taken. Please choose another.
            </p>
          ) : !isCheckingUsername &&
            usernameAvailable === true &&
            showUsernameFeedback ? (
            <p className="text-xs text-green-500">
              This username is available!
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Username must be unique and at least {MIN_USERNAME_LENGTH}{' '}
              characters long.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
