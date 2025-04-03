'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getJwt, saveJwt } from '@/components/lib/networkUtils';
import toast from 'react-hot-toast';
import { useUserStore } from 'stores/userStore';
import { Spinner } from 'theme-ui';
import Image from 'next/image';
import {
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/components/lib/firebase';
import { LoginType } from '@/lib/constants';

export const TabType = {
  password: 'Password',
  code: 'Code',
  signup: 'Sign Up'
};

export function LoginDialog() {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [account, seAccount] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const token = getJwt();
  const [isLoginProgress, setIsLoginProgress] = useState(false);
  const [tab, setTab] = useState(TabType['password']);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleSendCode = async () => {
    if (!account) {
      return toast.error('Please input valid email and code');
    }
    // if (account !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    //   return toast.error('Only admin can login with email');
    // }
    setIsSending(true);
    // const res = await fetch(`/api/auth/email`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     email: account
    //   })
    // });
    // console.log('🚀 ~ handleSendCode ~ res', res);
    // const data = await res.json();
    // if (data.code === 0) {
    //   setCountdown(60);
    //   setCode('');
    //   setIsSending(false);
    // } else {
    //   setIsSending(false);
    //   return toast.error(data?.message || 'Send failed');
    // }
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true
      };

      await sendSignInLinkToEmail(auth, account, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', account);

      toast.success('Sign-in link sent!');
      setCountdown(60);
      setCode('');
      setIsSending(false);
    } catch (error) {
      console.error('Error sending sign-in link:', error);
      toast.error('Error sending sign-in link');
    } finally {
      setIsSending(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!account || !code) {
      return toast.error('Please input valid email and code');
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/password-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: account,
          code
        })
      });
      const data = await res.json();
      console.log('🚀 ~ handleLogin ~ data', data);
      if (data.code === 0) {
        await saveJwt(data?.data?.token);
        setUser(data?.data?.user);
        router.push('/home');
      } else {
        return toast.error(data?.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoginProgress) return;
    setIsLoginProgress(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response: any = await fetch(`/api/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: result.user.uid,
          email: result.user.email
        })
      });

      const jsonRes = await response.json();

      if (jsonRes?.data?.token) {
        saveJwt(jsonRes.data.token);
        setUser({
          isAdmin: false,
          userKey: result.user.email || '',
          userId: result.user.uid || '',
          userKeyType: LoginType['email'],
          displayName: '',
          photoUrl: '',
          email: result.user.email || ''
        });
        return router.push('/home');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoginProgress(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-[24px]">
            {tab === TabType['signup'] ? 'Sign Up' : 'Login'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              onChange={(e) => seAccount(e.target.value)}
            />
          </div>
          {tab !== TabType['signup'] ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                placeholder="Enter code"
                value={code}
                onChange={(e: any) => setCode(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">Code</Label>
              <div className="flex flex-row gap-x-3">
                <Input
                  placeholder="Verify code"
                  value={code}
                  onChange={(e: any) => setCode(e.target.value)}
                />
                <Button
                  className="bg-primary"
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                  // loading={sendEmailLoading}
                >
                  {countdown > 0 ? `${countdown}s` : 'Send'}
                </Button>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={handlePasswordLogin}
          className="w-full mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner />
          ) : tab === TabType['signup'] ? (
            'Sign Up'
          ) : (
            'Sign In'
          )}
        </Button>
        <div className="text-center">
          {tab === TabType['signup']
            ? `Already have an account? `
            : `Don't have an account? `}
          <span
            className="text-primary cursor-pointer text-underline text-[14px] font-semibold hover:text-primary-600"
            onClick={() => {
              const newTab =
                tab === TabType['signup']
                  ? TabType['password']
                  : TabType['signup'];
              setTab(newTab);
            }}
          >
            {tab === TabType['signup'] ? 'Sign In' : 'Sign Up'}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-center w-full">
          <div className="border-t border-[#ABAFB3] flex-grow" />
          <div className="text-[#202020] text-[14px] text-center font-semibold mx-2 text-nowrap">
            Or
          </div>
          <div className="border-t border-[#ABAFB3] flex-grow" />
        </div>
        <div className="flex flex-row justify-center items-center gap-8 mb-4">
          {/* <div className="justify-center flex">
            <TelegramLoginButton />
          </div> */}

          <Button
            onClick={() => handleGoogleLogin()}
            className="w-full bg-white text-[#202020] text-[14px] text-center border-[#ABAFB3] border-[1px] rounded-[7px] gap-2 py-2 px-4 flex items-center justify-center"
          >
            <Image
              src={'/login/google.png'}
              alt="google"
              width={18}
              height={18}
            />
            login with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
