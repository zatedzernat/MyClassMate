'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Container,
    Stack,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Button,
    Breadcrumbs,
    Link,
    Snackbar,
    IconButton
} from '@mui/material';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { getTodayCourses } from '@/api/course-api';
import { TodayCourseResponse } from '@/api/data/course-response';
import { StudentValidateFace } from '@/components/dashboard/student/student-validate-face';
import { paths } from '@/paths';
import ErrorDialog from '@/components/error/error-dialog';

interface ToastState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

export default function StudentCheckInPage(): React.JSX.Element {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [todayCourse, setTodayCourse] = useState<TodayCourseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorDialogMessage, setErrorDialogMessage] = useState<string>('');

    // Toast state
    const [toast, setToast] = useState<ToastState>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Fetch today's courses and find the specific course
    const fetchTodaysCourseById = async (targetCourseId: string) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching today\'s courses for courseId:', targetCourseId);

            // Get all today's courses
            const todaysCourses = await getTodayCourses();

            // Find the specific course
            const course = todaysCourses.find(c => c.courseId.toString() === targetCourseId);

            if (!course) {
                throw new Error('ไม่พบรายวิชาที่เลือกในตารางเรียนวันนี้');
            }

            setTodayCourse(course);
            console.log('Found today\'s course:', course);

        } catch (error: any) {
            console.error('Error fetching today\'s course:', error);
            setError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา');
            setErrorDialogMessage(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchTodaysCourseById(courseId);
        } else {
            setError('ไม่พบรหัสรายวิชา');
            setErrorDialogMessage('ไม่พบรหัสรายวิชา กรุณาเลือกรายวิชาจากหน้าตารางเรียนวันนี้');
            setLoading(false);
        }
    }, [courseId]);

    // Handle scan completion
    const handleScanComplete = (success: boolean) => {
        if (success) {
            setToast({
                open: true,
                message: `เช็คชื่อเข้าเรียนสำเร็จ! รายวิชา ${todayCourse?.courseCode}`,
                severity: 'success'
            });
        } else {
            setToast({
                open: true,
                message: 'การยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
                severity: 'error'
            });
        }
    };

    // Handle navigation
    const handleBack = () => {
        router.push(paths.dashboard.todayCourses);
    };

    const handleCloseErrorDialog = () => {
        setErrorDialogMessage('');
        router.push(paths.dashboard.todayCourses);
    };

    // Handle toast close
    const handleCloseToast = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setToast(prev => ({ ...prev, open: false }));
    };

    // Format time display
    const formatTime = (time: string): string => {
        if (!time) return '';
        return time.substring(0, 5); // Display as HH:MM
    };

    // Get current date
    const getCurrentDate = (): string => {
        const today = new Date();
        return today.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Loading state
    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 3 }}>
                    <Stack spacing={3}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <CircularProgress size={60} sx={{ mb: 3 }} />
                            <Typography variant="h6" color="text.secondary">
                                กำลังโหลดข้อมูลรายวิชา...
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Container>
        );
    }

    // Error state
    if (error || !todayCourse) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 3 }}>
                    <Stack spacing={3}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                ไม่สามารถโหลดข้อมูลรายวิชาได้
                            </Typography>
                            <Typography variant="body1">
                                {error || 'ไม่พบข้อมูลรายวิชาที่เลือก'}
                            </Typography>
                        </Alert>

                        <Box sx={{ textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                onClick={handleBack}
                                startIcon={<ArrowLeftIcon size={20} />}
                            >
                                กลับไปหน้าตารางเรียน
                            </Button>
                        </Box>
                    </Stack>
                </Box>

                <ErrorDialog
                    open={Boolean(errorDialogMessage)}
                    message={errorDialogMessage}
                    onClose={handleCloseErrorDialog}
                />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <IconButton onClick={handleBack} size="small">
                                <ArrowLeftIcon size={20} />
                            </IconButton>
                            <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                เช็คชื่อเข้าเรียน
                            </Typography>
                        </Stack>

                        <Breadcrumbs sx={{ mb: 2 }}>
                            <Link
                                color="inherit"
                                href={paths.dashboard.todayCourses}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleBack();
                                }}
                                sx={{ cursor: 'pointer' }}
                            >
                                รายวิชาวันนี้
                            </Link>
                            <Typography color="text.primary">เช็คชื่อเข้าเรียน</Typography>
                        </Breadcrumbs>

                        <Typography variant="body1" color="text.secondary">
                            วันที่: {getCurrentDate()}
                        </Typography>
                    </Box>

                    {/* Course Information Card */}
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                                    📚 ข้อมูลรายวิชา
                                </Typography>

                                <Box sx={{ pl: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {todayCourse.courseCode}: {todayCourse.courseName}
                                    </Typography>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>เวลาเรียน:</strong> {formatTime(todayCourse.startTime)} - {formatTime(todayCourse.endTime)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>ห้องเรียน:</strong> {todayCourse.room}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Face Validation Component */}
                    <StudentValidateFace
                        todayCourse={todayCourse}
                        onScanComplete={handleScanComplete}
                    />
                </Stack>
            </Box>

            {/* Toast Notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={toast.severity}
                    onClose={handleCloseToast}
                    sx={{
                        '&.MuiAlert-filledSuccess': {
                            backgroundColor: '#388e3c',
                            color: '#ffffff',
                            fontWeight: 500,
                        },
                        '&.MuiAlert-filledError': {
                            backgroundColor: '#f44336',
                            color: '#ffffff',
                            fontWeight: 500,
                        },
                        '&.MuiAlert-filledWarning': {
                            backgroundColor: '#ff9800',
                            color: '#ffffff',
                            fontWeight: 500,
                        },
                        '&.MuiAlert-filledInfo': {
                            backgroundColor: '#2196f3',
                            color: '#ffffff',
                            fontWeight: 500,
                        },
                        fontSize: '0.95rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>

            {/* Error Dialog */}
            <ErrorDialog
                open={Boolean(errorDialogMessage)}
                message={errorDialogMessage}
                onClose={handleCloseErrorDialog}
            />
        </Container>
    );
}