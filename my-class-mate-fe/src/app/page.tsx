'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

export default function Page(): React.JSX.Element {
  const { checkSession } = useUser();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(true);

  useEffect(() => {
    const clearLocalStorageAndRedirect = async () => {
      try {
        localStorage.clear();
        
        const authKeys = [
          'custom-auth-token',
          'user-id', 
          'user-name',
          'user-role'
        ];
        
        authKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        await checkSession?.();
        console.log('✅ LocalStorage cleared on app start');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.replace('/auth/sign-in');
        
      } catch (error) {
        console.error('Error during cleanup:', error);
        router.replace('/auth/sign-in');
      } finally {
        setIsClearing(false);
      }
    };

    clearLocalStorageAndRedirect();
  }, [checkSession, router]);

  if (isClearing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f5f7fa'
        }}
      >
        {/* Splash Screen Logo */}
        <Paper
          elevation={12}
          sx={{
            width: 250,
            height: 250,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          <Box
            component="img"
            src="/assets/my-class-mate-logo.png"
            alt="MyClassMate"
            sx={{
              width: 180,
              height: 180,
              objectFit: 'contain'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
          {/* Fallback Logo */}
          <Box
            sx={{
              display: 'none',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'primary.main',
                lineHeight: 1.2
              }}
            >
              My<br />Class<br />Mate
            </Box>
          </Box>
        </Paper>

        {/* Add CSS animation */}
        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </Box>
    );
  }

  return <></>;
}