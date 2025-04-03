'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveJwt, getJwt } from '@/components/lib/networkUtils';
import toast from 'react-hot-toast';
import { useUserStore } from 'stores/userStore';
import { actionCodeSettings, auth } from '@/components/lib/firebase';

import { TabType } from '@/components/shared/login-dialog';
import Image from 'next/image';
import { LoginType } from '@/lib/constants';
import { validateEmail } from '../lib/utils';
import {
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup
} from 'firebase/auth';
import { Spinner } from 'theme-ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState(TabType['password']); // default password login
  const [isLoginProgress, setIsLoginProgress] = useState(false);
  const [showEmailSentDialog, setShowEmailSentDialog] = useState(false);

  const handleCancel = async () => {
    setLoading(false);
    setAccount('');
    setCode('');
    setTab(TabType['password']);
  };

  const handleVerify = async (user: any) => {
    try {
      const bodyData = {
        email: user.email,
        userId: user.uid,
        photoUrl: user.photoURL,
        displayName: user.displayName,
        userKeyType: LoginType['email']
      };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (data.code === 0) {
        await saveJwt(data?.data?.token);
        setUser({
          ...bodyData,
          userKey: data.data.username,
          isAdmin: data.data.isAdmin || false,
          role: 'subscriber'
        });
        toast.success('Login successful!');
        router.push('/subscriber/channels');
      } else {
        toast.error(data.message || 'Login failed!');
      }
    } catch (error) {
      console.error('verify email error', error);
      toast.error('Login failed!');
    } finally {
      await handleCancel();
    }
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        account,
        code
      );
      const idToken = await userCredential.user.getIdToken();

      if (!idToken) {
        console.log('idToken', idToken);
        return toast.error('Login failed!');
      }
      const user = userCredential.user;
      await handleVerify(user);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (tab === TabType['password']) {
      await handlePasswordLogin();
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoginProgress(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      if (!idToken) {
        console.log('idToken', idToken);
        return toast.error('Login failed!');
      }

      const user = result.user;

      await handleVerify(user);
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoginProgress(false);
    }
  };

  const handleEmailLink = async () => {
    const currentUrl = window.location.href;
    if (isSignInWithEmailLink(auth, currentUrl)) {
      setLoading(true);
      try {
        const account = window.localStorage.getItem('emailForSignIn');
        if (!account) {
          toast.error('link is expired');
          return;
        }

        signInWithEmailLink(auth, account, window.location.href)
          .then(async (result) => {
            console.log('..result..', result);
            console.log('sign in with email success', result);
            window.localStorage.removeItem('emailForSignIn');
            await handleVerify(result.user);
            router.push('/dashboard');
          })
          .catch((error) => {
            console.log('sign in with email with error', error);
            toast.error(error.message);
          });
      } catch (error: any) {
        console.error('email link login with error:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    handleEmailLink();
  }, []);

  const sendEmailLinkLogin = async () => {
    if (!account || !validateEmail(account)) {
      return toast.error('Please input valid email');
    }
    setLoading(true);
    sendSignInLinkToEmail(auth, account, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem('emailForSignIn', account);
        setShowEmailSentDialog(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error('sign in with email with error', error);
        toast.error(error.message);
        setLoading(false);
      });
  };

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="justify-center ">
          <div className="text-center text-2xl font-semibold">Sign In</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-8">
            <div className="flex flex-row justify-center items-center gap-8 mb-4">
              <Button
                onClick={() => handleGoogleLogin()}
                disabled={isLoginProgress}
                className="w-full bg-white text-[#202020] hover:text-white text-[14px] text-center border-[#ABAFB3] border-[1px] rounded-[7px] gap-2 py-2 px-4 flex items-center justify-center"
              >
                <Image
                  src={'/login/google.png'}
                  alt="google"
                  width={18}
                  height={18}
                />
                Login with Google
              </Button>
            </div>
            <div className="my-4 flex items-center justify-center w-full">
              <div className="border-t border-[#ABAFB3] flex-grow" />
              <div className="text-[#202020] text-[14px] text-center font-semibold mx-2 text-nowrap">
                Or
              </div>
              <div className="border-t border-[#ABAFB3] flex-grow" />
            </div>
            <div className="space-y-2">
              {/* <Label htmlFor="email">Email</Label> */}
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Image
                    src={
                      showPassword
                        ? '/icons/eye-open.svg'
                        : '/icons/eye-close.svg'
                    }
                    alt={showPassword ? 'hide password' : 'show password'}
                    width={20}
                    height={20}
                    className="text-gray-500"
                  />
                </button>
              </div>
              <div className="flex justify-end">
                <span
                  className="text-primary cursor-pointer text-sm hover:text-primary-600 underline"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </span>
              </div>
            </div> */}
          </div>
          <Button
            onClick={sendEmailLinkLogin}
            className="w-full mb-8"
            disabled={!validateEmail(account)}
          >
            {loading && <Spinner size={16} />} Sign In
          </Button>

          {/* <div className="text-center text-sm">
            {`Don't have an account? `}
            <span
              className="text-primary cursor-pointer underline text-[14px] font-semibold hover:text-primary-600"
              onClick={() => {
                router.push('/signup');
              }}
            >
              Sign Up
            </span>
          </div> */}
        </CardContent>
      </Card>
      <Dialog
        open={showEmailSentDialog}
        onOpenChange={() => {
          setShowEmailSentDialog(false);
          setLoading(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Sent</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              We have sent a link to your email. Please check your email and
              click the link to sign in.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowEmailSentDialog(false)}
              className="w-32"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
