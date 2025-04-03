'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveJwt } from '@/components/lib/networkUtils';
import toast from 'react-hot-toast';
import { useUserStore } from 'stores/userStore';
import { auth } from '@/components/lib/firebase';
import { LoginPath, LoginType } from '@/lib/constants';
import { validateEmail } from '@/components/lib/utils';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Image from 'next/image';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');

  const handleCancel = async () => {
    setLoading(false);
    setAccount('');
  };

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
          userKey: data.username,
          isAdmin: data.isAdmin || false,
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

  const handleEmailSignUp = async () => {
    setLoading(true);

    createUserWithEmailAndPassword(auth, account, password)
      .then(async (userCredential: { user: any }) => {
        const user = userCredential.user;
        await handleVerify(user);
      })
      .catch((error: any) => {
        console.error('sign in with email with error', error);
        toast.error(error.message);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSignup = async () => {
    if (!account || !validateEmail(account)) {
      return toast.error('Please input valid email');
    }

    if (!password || !rePassword) {
      return toast.error('Please input password');
    }

    if (password !== rePassword) {
      return toast.error(
        'Please check the password, the two passwords do not match'
      );
    }
    await handleEmailSignUp();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="justify-center ">
        <div className="text-center text-2xl font-semibold">Sign Up</div>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                required
                onChange={(e) => setPassword(e.target.value)}
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="rePassword"
                name="rePassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                required
                onChange={(e) => setRePassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Image
                  src={
                    showConfirmPassword
                      ? '/icons/eye-open.svg'
                      : '/icons/eye-close.svg'
                  }
                  alt={showConfirmPassword ? 'hide password' : 'show password'}
                  width={20}
                  height={20}
                  className="text-gray-500"
                />
              </button>
            </div>
          </div>
        </div>
        <Button
          onClick={() => handleSignup()}
          className="w-full mb-8"
          disabled={!validateEmail(account)}
        >
          Sign Up
        </Button>

        <div className="text-center">
          {`Already have an account? `}
          <span
            className="text-primary cursor-pointer underline text-sm font-semibold hover:text-primary-600"
            onClick={() => {
              router.push(LoginPath);
            }}
          >
            Sign In
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
