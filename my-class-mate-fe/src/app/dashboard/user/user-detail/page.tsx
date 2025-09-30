'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { UserRegisterFaces } from '@/components/dashboard/user/user-detail/user-register-faces';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadImage, setIsUploadImage] = useState(false); // New flag for upload UI

  // Fetch user data function
  const fetchUserData = async () => {
    if (!userId) return;

    try {
      setIsRefreshing(true);
      const userData = await getUser(userId);
      setUser(userData);
      console.log('User data refreshed:', userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserData();
  }, [userId]);

  // Handle upload completion - refresh user data
  const handleUploadComplete = async (success: boolean) => {
    console.log('Upload completed with status:', success);

    if (success) {
      // Hide upload UI and refresh data
      setIsUploadImage(false);

      // Wait a moment for backend to process
      setTimeout(async () => {
        await fetchUserData();
      }, 1500); // 1.5 second delay to ensure backend has processed the upload
    }
  };

  // Handle data refresh (for manual refresh buttons)
  const handleDataUpdate = async () => {
    await fetchUserData();
  };

  // Toggle upload image UI
  const handleToggleUploadImage = () => {
    setIsUploadImage(!isUploadImage);
  };

  if (loading && !user) {
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
            รายละเอียดผู้ใช้งาน {isRefreshing && '(กำลังรีเฟรช...)'}
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
              onDataUpdate={handleDataUpdate} // Pass refresh function
              isUploadImage={isUploadImage} // Pass upload UI flag
              onToggleUploadImage={handleToggleUploadImage} // Pass toggle function
            />
          </Box>

          {/* Camera Section - Only show for STUDENT role and when isUploadImage is true */}
          {user && user.role === Role.STUDENT && isUploadImage && (
            <Box
              sx={{
                width: '100%',
                px: { xs: 0, sm: 1 },
                justifyContent: 'center',
              }}
            >
              <UserRegisterFaces
                userResponse={user}
                onUploadComplete={handleUploadComplete} // Pass upload completion handler
                onDataUpdate={handleDataUpdate} // Pass data refresh function
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}