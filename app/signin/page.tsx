import { LoginForm } from '@/components/ui/login-form';
import { Logo1Icon } from '@/components/icons/logo-1';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center pt-[10vh] p-4">
      <div className="flex flex-col items-center mb-8">
        <Logo1Icon className="w-20 h-20 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
      </div>
      <LoginForm />
    </div>
  );
}
