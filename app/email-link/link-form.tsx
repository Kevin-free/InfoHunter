'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveJwt } from '@/components/lib/networkUtils';
import toast from 'react-hot-toast';
import { useUserStore } from 'stores/userStore';
import { actionCodeSettings, auth } from '@/components/lib/firebase';
import { LoginPath, LoginType } from '@/lib/constants';
import { validateEmail } from '@/components/lib/utils';
import {
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Spinner } from 'theme-ui';

export function LinkForm() {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [showEmailSentDialog, setShowEmailSentDialog] = useState(false);

  const handleVerify = async (user: any) => {
    try {
      const bodyData = {
        email: user.email,
        userId: user.uid,
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
          displayName: '',
          photoUrl: ''
        });
        router.push('/dashboard');
        toast.success('Login successful!');
      } else {
        toast.error(data.message || 'Login failed!');
      }
    } catch (error) {
      console.error('verify email error', error);
      toast.error('Login failed!');
    } finally {
      setLoading(false);
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
            // window.history.replaceState({}, document.title, '/');
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
    if (typeof window !== 'undefined') {
      handleEmailLink();
    }
  }, []);

  const handleEmailCodeLogin = async () => {
    if (!account || !validateEmail(account)) {
      return toast.error('Please input valid email');
    }

    setLoading(true);
    sendSignInLinkToEmail(auth, account, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem('emailForSignIn', account);
        setShowEmailSentDialog(true);
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                required
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => handleEmailCodeLogin()}
            className="w-full mb-8"
            disabled={!validateEmail(account)}
          >
            {loading && <Spinner size={16} className="mr-4" />} Continues
          </Button>
        </CardContent>
      </Card>
      <Dialog open={showEmailSentDialog} onOpenChange={setShowEmailSentDialog}>
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
