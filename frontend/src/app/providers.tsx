'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="bottom-right" richColors toastOptions={{ style: { fontSize: '13px' } }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
