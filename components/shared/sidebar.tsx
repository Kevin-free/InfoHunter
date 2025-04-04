'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserStore } from 'stores/userStore';
import { deleteJwt } from '../lib/networkUtils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LoginPath } from '@/lib/constants';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ResizableSidebar } from './resizable-sidebar';
import {
  MessagesSquare,
  Workflow,
  UserCircle2,
  LogOut,
  ChevronsUpDown,
  DatabaseZap,
  Settings,
  Bot
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo1Icon } from '../icons/logo-1';

export function Sidebar() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const setUserRole = useUserStore((state) => state.setUserRole);
  const pathname = usePathname();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if first visit and show tooltip/popover
  useEffect(() => {
    // Only proceed if user is logged in
    if (!user) return;

    const hasSeenRoleTip = localStorage.getItem('hasSeenRoleTip');

    if (!hasSeenRoleTip) {
      // Auto open popover on first visit
      setPopoverOpen(true);
      setShowTooltip(true);

      // Hide tooltip after 5 seconds
      tooltipTimerRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);

      // Mark as seen in localStorage
      localStorage.setItem('hasSeenRoleTip', 'true');
    }

    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, [user]);

  const handleLogout = async () => {
    await deleteJwt();
    setUser(null as any);
    signOut(auth);
    router.push(LoginPath);
  };

  // 根据路径获取导航链接
  const getNavLinks = () => {
    if (pathname?.startsWith('/publisher')) {
      return [
        {
          href: '/publisher/channels',
          label: 'Channels',
          icon: DatabaseZap,
          show: true
        },
        {
          href: '/publisher/groups',
          label: 'Groups',
          icon: MessagesSquare,
          show: true
        },
        {
          href: '/publisher/accounts',
          label: 'Accounts',
          icon: UserCircle2,
          show: true
        }
      ];
    }

    if (pathname?.startsWith('/subscriber')) {
      return [
        {
          href: '/subscriber/channels',
          label: 'Channels',
          icon: DatabaseZap,
          show: true
        },
        {
          href: '/subscriber/workflows',
          label: 'Agents',
          icon: Bot,
          show: true
        }
      ];
    }

    // 添加对 /settings 路径的处理
    if (pathname?.startsWith('/settings')) {
      // 根据用户角色返回对应的导航链接
      if (user?.role === 'publisher') {
        return [
          {
            href: '/publisher/channels',
            label: 'Channels',
            icon: DatabaseZap,
            show: true
          },
          {
            href: '/publisher/groups',
            label: 'Groups',
            icon: MessagesSquare,
            show: true
          },
          {
            href: '/publisher/accounts',
            label: 'Accounts',
            icon: UserCircle2,
            show: true
          }
        ];
      } else {
        return [
          {
            href: '/subscriber/channels',
            label: 'Channels',
            icon: DatabaseZap,
            show: true
          },
          {
            href: '/subscriber/workflows',
            label: 'Agents',
            icon: Bot,
            show: true
          }
        ];
      }
    }

    return [];
  };

  const navLinks = getNavLinks();

  const getUserInitials = (userKey: string) => {
    return userKey.substring(0, 2).toUpperCase();
  };

  const handleRoleChange = (value: string) => {
    const newRole = value as 'publisher' | 'subscriber';
    setUserRole(newRole);

    if (newRole === 'publisher') {
      router.push('/publisher/channels');
    } else {
      router.push('/subscriber/channels');
    }
  };

  return (
    <ResizableSidebar>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="px-2 py-6">
          <Link href="/" className="flex items-center gap-2 px-2">
            <img
              src="/assets/infohunter_logo.png"
              alt="logo"
              className="w-5 h-auto shrink-0"
            />
            <span className="truncate transition-opacity duration-300 group-[.collapsed]:opacity-0 text-xl">
              <span className="font-bold">Info</span>
              <span className="font-light">Hunter</span>
            </span>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-2">
          <TooltipProvider delayDuration={0}>
            {navLinks.map(
              (link) =>
                link.show && (
                  <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                      {link.label.includes('Coming Soon') ? (
                        <div
                          className={cn(
                            'flex items-center p-2 mb-1 rounded-md transition-colors cursor-not-allowed opacity-70',
                            'text-muted-foreground'
                          )}
                        >
                          <link.icon className={cn('h-5 w-5 shrink-0')} />
                          <span
                            className={cn(
                              'ml-3 truncate transition-opacity duration-300 group-[.collapsed]:opacity-0'
                            )}
                          >
                            {link.label}
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={link.href}
                          className={cn(
                            'flex items-center p-2 mb-1 rounded-md transition-colors',
                            pathname?.startsWith(link.href)
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-primary/5'
                          )}
                        >
                          <link.icon className={cn('h-5 w-5 shrink-0')} />
                          <span
                            className={cn(
                              'ml-3 truncate transition-opacity duration-300 group-[.collapsed]:opacity-0'
                            )}
                          >
                            {link.label}
                          </span>
                        </Link>
                      )}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="group-[.collapsed]:block hidden"
                    >
                      {link.label}
                    </TooltipContent>
                  </Tooltip>
                )
            )}
          </TooltipProvider>
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-2 border-t relative">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center p-2 rounded-md space-x-3 hover:bg-muted cursor-pointer">
                  <Avatar className="h-9 w-9">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.userKey} />
                    ) : (
                      <AvatarFallback>
                        {getUserInitials(user.userKey)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0 transition-opacity duration-300 group-[.collapsed]:opacity-0">
                    <p className="text-sm font-medium truncate">
                      {user.userKey}
                    </p>
                  </div>
                  <div className="text-muted-foreground transition-transform duration-200 group-[.collapsed]:hidden">
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="start" side="top">
                {/* Role Selector */}
                <div className="p-3 border-b relative">
                  <Tabs
                    defaultValue={user.role}
                    value={user.role}
                    onValueChange={handleRoleChange}
                    className="w-full mt-2 relative"
                  >
                    {showTooltip && (
                      <div
                        className="absolute inset-0 bg-primary/90 text-white p-2 rounded-md text-center flex items-center justify-center text-sm animate-pulse cursor-pointer z-50"
                        onMouseEnter={() => setShowTooltip(false)}
                      >
                        Click here to switch your role
                      </div>
                    )}
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="publisher">Publisher</TabsTrigger>
                      <TabsTrigger value="subscriber">Subscriber</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="p-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 font-normal"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 font-normal"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </ResizableSidebar>
  );
}
