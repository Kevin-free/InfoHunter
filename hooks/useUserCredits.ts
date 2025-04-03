import { useState, useEffect, useCallback } from 'react';
import { getJwt } from '@/components/lib/networkUtils';

export function useUserCredits(userId: string | undefined) {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const refreshCredits = useCallback(() => {
    setRefreshFlag((prev) => !prev);
  }, []);

  useEffect(() => {
    async function fetchCredits() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const token = getJwt();
        const response = await fetch(`/api/user/credits?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch credits');

        const data = await response.json();
        setCredits(data.credits);
      } catch (error) {
        console.error('Error fetching user credits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, [userId, refreshFlag]);

  return { credits, loading, refreshCredits };
}
