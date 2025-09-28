'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

import { UserResponse } from '@/api/data/user-response';
import { getUser } from '@/api/user-api';
import { getRoleLabel, Role } from '@/util/role-enum';

interface StudentInfoProps {
  onUploadClick?: () => void;
}

// Mock student data for temporary use
const mockStudentData: UserResponse = {
  userId: 'STU001',
  username: 'student001',
  password: '', // Not shown to user
  nameTh: 'สมชาย',
  surnameTh: 'ใจดี',
  nameEn: 'Somchai',
  surnameEn: 'Jaidee',
  email: 'somchai.jaidee@school.ac.th',
  role: Role.STUDENT,
  isDeleted: false,
  isUploadedImage: false, // Change to true to test uploaded state
  studentProfile: {
    studentNo: '65010001'
  },
  imageCount: 0
};

export function StudentInfo({ onUploadClick }: StudentInfoProps): React.JSX.Element {
  const [student, setStudent] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get user info from localStorage
        const userId = localStorage.getItem('user-id');
        const userName = localStorage.getItem('user-name');
        const userRole = localStorage.getItem('user-role');
        
        if (!userId || userRole !== 'STUDENT') {
          setError('ไม่พบข้อมูลนักเรียน');
          return;
        }

        // Simulate API delay
        setTimeout(() => {
          // Create mock data based on localStorage info
          const mockData: UserResponse = {
            ...mockStudentData,
            userId: userId,
            nameTh: userName?.split(' ')[0] || 'นักเรียน',
            surnameTh: userName?.split(' ')[1] || 'ตัวอย่าง',
            // Randomly set upload status for demo
            isUploadedImage: Math.random() > 0.5,
          };

          setStudent(mockData);
          setLoading(false);
        }, 1000);

        // Uncomment this to use real API data
        // const userData = await getUser(userId);
        // 
        // // Verify this is actually a student
        // if (userData.role !== Role.STUDENT) {
        //   setError('ผู้ใช้นี้ไม่ใช่นักเรียน');
        //   return;
        // }
        // 
        // setStudent(userData);
        
      } catch (err: any) {
        console.error('Error fetching student data:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Stack spacing={2} alignItems="center">
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                กำลังโหลดข้อมูลนักเรียน...
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" variant="h6">
              ⚠️ เกิดข้อผิดพลาด
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              โหลดข้อมูลใหม่
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" variant="body1">
              ไม่พบข้อมูลนักเรียน
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          {/* Student Details */}
          <Stack spacing={2} sx={{ textAlign: 'center', width: '100%' }}>
            {/* Thai Name */}
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {student.nameTh} {student.surnameTh}
            </Typography>

            {/* English Name */}
            {student.nameEn && student.surnameEn && (
              <Typography color="text.secondary" variant="body1">
                {student.nameEn} {student.surnameEn}
              </Typography>
            )}

            {/* Student Details */}
            <Stack spacing={1.5}>
              {/* Student Number */}
              {student.studentProfile?.studentNo && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  px: 2
                }}>
                  <Typography color="text.secondary" variant="body2">
                    รหัสนักเรียน:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {student.studentProfile.studentNo}
                  </Typography>
                </Box>
              )}

              {/* Username */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2
              }}>
                <Typography color="text.secondary" variant="body2">
                  ชื่อผู้ใช้:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {student.username}
                </Typography>
              </Box>

              {/* Email */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2
              }}>
                <Typography color="text.secondary" variant="body2">
                  อีเมล:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {student.email}
                </Typography>
              </Box>

              {/* Role */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mt: 1
              }}>
                <Chip 
                  label={getRoleLabel(student.role)}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}