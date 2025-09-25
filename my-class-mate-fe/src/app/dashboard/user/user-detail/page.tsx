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
      <Stack spacing={3}>
        <Typography variant="h4">Loading...</Typography>
      </Stack>
    );
  }


// // In the parent component where you use UserValidateFace
// const mockUser: UserResponse = {
//   userId: '12345',
//   nameTh: "สมชาย",
//   surnameTh: "ใจดี",
//   nameEn: "Somchai",
//   surnameEn: "Jaidee",
//   role: Role.STUDENT, // or whatever role enum you have
//   isUploadedImage: true, // ← This is the key property
//   imageCount: 4,
//   username: '',
//   email: ''
// };


  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">ข้อมูลผู้ใช้งาน</Typography>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ lg: 4, md: 6, xs: 12 }}>
          <UserInfo 
            user={user}
            onToggleDetailsForm={handleToggleDetailsForm}
            showDetailsForm={showDetailsForm}
          />
        </Grid>
        
        <Grid size={{ lg: 8, md: 6, xs: 12 }}>
          <UserValidateFace 
            user={user}
            onScanComplete={(success) => {
              console.log('Scan completed:', success ? 'Success' : 'Failed');
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}