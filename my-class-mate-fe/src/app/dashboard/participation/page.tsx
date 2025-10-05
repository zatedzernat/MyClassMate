'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { getTodayCourses } from '@/api/course-api';
import { TodayCourseResponse } from '@/api/data/course-response';
import ErrorDialog from '@/components/error/error-dialog';
import { paths } from '@/paths';

// Helper functions moved to outer scope
const formatTime = (time: string): string => {
  if (!time) return '';
  return time.slice(0, 5); // Display as HH:MM
};

const getCurrentDate = (): string => {
  const today = new Date();
  return today.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function ParticipationPage(): React.JSX.Element {
  const router = useRouter();
  const [courses, setCourses] = useState<TodayCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogMessage, setErrorDialogMessage] = useState<string>('');

  // Fetch today's courses
  const fetchTodayCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching today\'s courses...');
      const todayCourses = await getTodayCourses();
      setCourses(todayCourses);
      console.log('Today\'s courses:', todayCourses);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดตารางเรียนวันนี้';
      console.error('Error fetching today\'s courses:', error);
      setError(errorMessage);
      setErrorDialogMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayCourses();
  }, []);

  // Handle participation button - navigate to participation detail page
  const handleViewParticipation = (course: TodayCourseResponse) => {
    console.log('Navigating to participation for course schedule:', course.courseScheduleId);
    
    // Navigate to participation detail page with courseScheduleId as query parameter
    router.push(`${paths.dashboard.participation}/participation-detail?courseScheduleId=${course.courseScheduleId}`);
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogMessage('');
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            การมีส่วนร่วม
          </Typography>
          <Typography variant="h6" color="text.secondary">
            ข้อมูลรายวิชาที่มีเรียนประจำวัน
          </Typography>
        </Box>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>กำลังโหลดตารางเรียนวันนี้...</Typography>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Today's Courses Table */}
        {!loading && !error && (
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CalendarIcon size={20} />
                  <Typography variant="h6">
                    วันที่ {getCurrentDate()}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  พบรายวิชาที่มีเรียนวันนี้ {courses.length} วิชา
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                        วันที่มีการเรียนการสอน
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>
                        รหัสวิชา
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                        ชื่อวิชา
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 80 }}>
                        เวลาเริ่ม
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 80 }}>
                        เวลาสิ้นสุด
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 100 }}>
                        ห้องเรียน
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 100 }}>
                        หมายเหตุ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 120 }}>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            วันนี้ไม่มีรายวิชาที่ต้องเรียน
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      courses.map((course) => (
                        <TableRow key={course.courseScheduleId} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {getCurrentDate()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {course.courseCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {course.courseName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatTime(course.startTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatTime(course.endTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {course.room}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {course.remark || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleViewParticipation(course)}
                              sx={{ 
                                minWidth: 120,
                                fontSize: '0.75rem',
                                py: 0.5,
                                backgroundColor: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                }
                              }}
                            >
                              ดูข้อมูลการมีส่วนร่วม
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Error Dialog */}
      <ErrorDialog
        open={Boolean(errorDialogMessage)}
        message={errorDialogMessage}
        onClose={handleCloseErrorDialog}
      />
    </Box>
  );
}