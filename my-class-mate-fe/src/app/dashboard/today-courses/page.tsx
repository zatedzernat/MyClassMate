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
import { getButtonState, formatTime, getCurrentDate } from '@/util/time-utils';

export default function TodayCoursesPage(): React.JSX.Element {
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

  // Handle attendance check button - navigate to student check-in page
  const handleAttendanceCheck = (course: TodayCourseResponse) => {
    console.log('Navigating to check-in for course:', course.courseId, course.courseCode);
    
    // Navigate to student check-in page with courseId as query parameter
    router.push(`${paths.dashboard.todayCourses}/student-check-in?courseId=${course.courseId}`);
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
            เช็คชื่อเข้าเรียน
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
                  พบรายวิชาที่มีเรียนวันนี้ {courses.length} วิชา (สามารถเช็คชื่อเข้าเรียนได้เฉพาะรายวิชาที่อยู่ในช่วงเวลาที่กำหนด หรือก่อนหน้า 1 ชั่วโมง)
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
                        <TableRow key={course.courseId} hover>
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
                            {(() => {
                              const buttonState = getButtonState(course.startTime, course.endTime);
                              return buttonState.show ? (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleAttendanceCheck(course)}
                                  disabled={buttonState.disabled}
                                  sx={{ 
                                    minWidth: 100,
                                    fontSize: '0.75rem',
                                    py: 0.5,
                                    backgroundColor: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.dark',
                                    }
                                  }}
                                >
                                  เช็คชื่อเข้าเรียน
                                </Button>
                              ) : (null);
                            })()}
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