'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Metadata } from 'next';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { UserValidateFace } from '@/components/dashboard/user/user-detail/user-validate-face';
import { UserInfo } from '@/components/dashboard/user/user-detail/user-info';
import { getUser } from '@/api/user-api';
import { UserResponse } from '@/api/data/user-response';
import { Role } from '@/util/role-enum';
import { Box, Container } from '@mui/system';

export default function Page(): React.JSX.Element {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        try {
          const userData = await getUser(userId);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [userId]);

  const handleToggleDetailsForm = () => {
    setShowDetailsForm(!showDetailsForm);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography variant="h4">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
      <Stack spacing={3} sx={{ py: { xs: 0.5, sm: 0.5 } }}>
        {/* Header - Minimal top padding */}
        <Box sx={{ textAlign: 'start', px: { xs: 1, sm: 2 }, pt: 0, pb: 0 }}>
          <Typography variant="h4" sx={{ mb: 0 }}>
            รายละเอียดผู้ใช้งาน
          </Typography>
        </Box>

        {/* Vertical Layout - User Info First, then Camera */}
        <Stack spacing={3}>
          {/* User Info Section - Full width with minimal horizontal padding */}
          <Box
            sx={{
              width: '100%',
              px: { xs: 0, sm: 1 },
            }}
          >
            <UserInfo 
              user={user}
              onToggleDetailsForm={handleToggleDetailsForm}
              showDetailsForm={showDetailsForm}
            />
          </Box>

          {/* Camera Section - Only show for STUDENT role */}
          {user && user.role === Role.STUDENT && (
            <Box
              sx={{
                width: '100%',
                px: { xs: 0, sm: 1 },
                justifyContent: 'center',
              }}
            >
              <UserValidateFace 
                user={user}
                onScanComplete={(success) => {
                  console.log('Scan completed:', success ? 'Success' : 'Failed');
                }}
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}