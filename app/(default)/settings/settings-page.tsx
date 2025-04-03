'use client';

import { useState } from 'react';
import { UserCreditsPanel } from './user-credits-panel';
import { BasicInfoPanel } from './basic-info-panel';
import { ApiKeysPanel } from './api-keys-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from 'stores/userStore';
import { CreditsUsageHistoryPanel } from './credits-history-panel';
import { PaymentHistoryPanel } from './payment-history-panel';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('basic-info');
  const user = useUserStore((state) => state.user);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account, billing, and API keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {/* Left column for tabs */}
        <div className="md:col-span-1">
          <Tabs
            defaultValue="basic-info"
            orientation="vertical"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex flex-col items-start space-y-1 h-auto bg-transparent">
              <TabsTrigger
                value="basic-info"
                className="w-full justify-start px-4 py-2 text-left"
              >
                Basic Information
              </TabsTrigger>
              <TabsTrigger
                value="credits"
                className="w-full justify-start px-4 py-2 text-left"
              >
                Credits
              </TabsTrigger>
              <TabsTrigger
                value="credits-usage"
                className="w-full justify-start px-4 py-2 text-left"
              >
                Credits History
              </TabsTrigger>
              <TabsTrigger
                value="payment-history"
                className="w-full justify-start px-4 py-2 text-left"
              >
                Payment History
              </TabsTrigger>
              <TabsTrigger
                value="api-keys"
                className="w-full justify-start px-4 py-2 text-left"
              >
                API Keys
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right column for content */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="basic-info" className="mt-0">
              <BasicInfoPanel user={user} />
            </TabsContent>
            <TabsContent value="credits" className="mt-0">
              <UserCreditsPanel userId={user?.userId} />
            </TabsContent>
            <TabsContent value="credits-usage" className="mt-0">
              <CreditsUsageHistoryPanel userId={user?.userId} />
            </TabsContent>
            <TabsContent value="payment-history" className="mt-0">
              <PaymentHistoryPanel userId={user?.userId} />
            </TabsContent>
            <TabsContent value="api-keys" className="mt-0">
              <ApiKeysPanel userId={user?.userId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
