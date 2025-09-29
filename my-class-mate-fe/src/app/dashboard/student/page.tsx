'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getStudentProfile } from '@/api/student-api';
import { Box, Container } from '@mui/system';
import { StudentInfo } from '@/components/dashboard/student/student-info';
import { StudentResponse } from '@/api/data/student-response';

export default function Page(): React.JSX.Element {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [studentData, setStudentData] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      // Try to get userId from URL params or localStorage
      const targetUserId = userId || localStorage.getItem('user-id');

      if (targetUserId) {
        try {
          setLoading(true);
          setError(null);

          const response = await getStudentProfile(targetUserId);
          setStudentData(response);

        } catch (error: any) {
          console.error('Error fetching student profile:', error);
          setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
        } finally {
          setLoading(false);
        }
      } else {
        setError('ไม่พบข้อมูลผู้ใช้');
        setLoading(false);
      }
    };

    fetchStudent();
  }, [userId]);

  const handleToggleDetailsForm = () => {
    setShowDetailsForm(!showDetailsForm);
  };

  // Callback to refresh student data after updates
  const handleDataUpdate = async () => {
    const targetUserId = userId || localStorage.getItem('user-id');
    if (!targetUserId) return;

    try {
      const response = await getStudentProfile(targetUserId);
    
        setStudentData(response);

    } catch (error: any) {
      console.error('Error refreshing student data:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการรีเฟรชข้อมูลนักศึกษา');
    }
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography variant="h5" color="error" gutterBottom>
            เกิดข้อผิดพลาด
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!studentData) {
    return (
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography variant="h5" color="text.secondary">
            ไม่พบข้อมูลนักศึกษา
          </Typography>
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
            รายละเอียดนักศึกษา
          </Typography>
        </Box>

        {/* Vertical Layout - Student Info First, then Camera */}
        <Stack spacing={3}>
          {/* Student Info Section - Full width with minimal horizontal padding */}
          <Box
            sx={{
              width: '100%',
              px: { xs: 0, sm: 1 },
            }}
          >
            <StudentInfo
              studentData={studentData}
              onDataUpdate={handleDataUpdate}
            />
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}