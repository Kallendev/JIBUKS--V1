import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import apiService, { Account } from '@/services/api';

interface AccountsContextValue {
  accounts: Account[];
  defaultAccount: Account | null;
  loading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | undefined>(undefined);

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated before loading accounts
      const token = await require('@react-native-async-storage/async-storage').default.getItem('authToken');
      if (!token) {
        console.log('⚠️ No auth token found, skipping account load');
        setAccounts([]);
        setLoading(false);
        return;
      }

      console.log('🔄 Loading accounts from database...');

      // Fetch accounts with balances from backend
      const data = await apiService.listAccounts({ includeBalances: true });

      console.log('✅ Accounts loaded successfully:', {
        count: data?.length || 0,
        types: [...new Set((data || []).map(a => a.type))],
        sample: (data || []).slice(0, 3).map(a => ({ code: a.code, name: a.name, id: a.id }))
      });

      setAccounts(data || []);

    } catch (err: any) {
      console.error('❌ Error loading accounts:', err);
      const errorMsg = err?.error || err?.message || 'Failed to load accounts from server';
      setError(errorMsg);
      setAccounts([]); // Empty accounts on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const value = useMemo<AccountsContextValue>(
    () => ({
      accounts,
      defaultAccount: accounts.find(a => a.isDefault) || accounts[0] || null,
      loading,
      error,
      refreshAccounts: loadAccounts,
    }),
    [accounts, loading, error]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
};

export const useAccounts = () => {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return ctx;
};

export default AccountsContext;
