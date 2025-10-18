'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Stack,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Breadcrumbs,
    Link,
    IconButton,
    Skeleton
} from '@mui/material';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { paths } from '@/paths';
import { getCourseById, importStudentToCourse, exportStudentToCourse } from '@/api/course-api';
import { CourseResponse } from '@/api/data/course-response';
import ErrorDialog from '@/components/error/error-dialog';

interface Student {
    studentId: number;
    studentNo: string;
    studentNameTh: string;
    studentNameEn: string;
}

export default function AddStudentToCoursePage(): React.JSX.Element {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [courseDetail, setCourseDetail] = useState<CourseResponse | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingCourse, setLoadingCourse] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [errorDialogMessage, setErrorDialogMessage] = useState<string>('');

    // Fetch course data
    const fetchCourse = async (id: string) => {
        setLoadingCourse(true);
        try {
            console.log('Fetching course with ID:', id);
            const response = await getCourseById(id);
            setCourseDetail(response);

            // Extract students from enrollments
            const enrolledStudents = response.enrollments.map((enrollment) => ({
                studentId: enrollment.studentId,
                studentNo: enrollment.studentNo,
                studentNameTh: enrollment.studentNameTh,
                studentNameEn: enrollment.studentNameEn || 'N/A'
            }));

            setStudents(enrolledStudents);

        } catch (error: any) {
            console.error('Error fetching course:', error);
            setErrorDialogMessage(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายวิชา');
        } finally {
            setLoadingCourse(false);
        }
    };

    // Load course data when component mounts
    useEffect(() => {
        if (courseId) {
            fetchCourse(courseId);
        } else {
            setErrorDialogMessage('ไม่พบรหัสรายวิชา');
            setLoadingCourse(false);
        }
    }, [courseId]);

    const handleImportStudents = async () => {
        setUploading(true);
        setError(null);
        try {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv,.xlsx,.xls';
            fileInput.multiple = false;

            fileInput.onchange = async (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file && courseId) {
                    try {
                        console.log('Importing file:', file.name);
                        console.log('Import students to course:', courseId);

                        // Call the actual API
                        const result = await importStudentToCourse(courseId, file);

                        // Reload course data after import
                        await fetchCourse(courseId);

                        // Handle success message and invalid student numbers
                        if (result.invalidStudentNos && result.invalidStudentNos.length > 0) {
                            // Show error for invalid student numbers
                            setError(`รหัสนักศึกษาที่ไม่ถูกต้อง: ${result.invalidStudentNos.join(', ')}`);
                            
                            // Show success only if some students were added
                            if (result.createdRow > 0) {
                                setSuccess(`เพิ่มนักเรียนสำเร็จ: ${result.createdRow} คน (มีรหัสนักศึกษาไม่ถูกต้อง ${result.invalidStudentNos.length} คน)`);
                            }
                        } else {
                            // All students imported successfully
                            setSuccess(`เพิ่มนักเรียนสำเร็จ: จำนวน ${result.createdRow} คน`);
                        }

                    } catch (importError: any) {
                        setError(importError.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูลนักเรียน');
                    }
                }
            };

            fileInput.click();

        } catch (error: any) {
            setError('เกิดข้อผิดพลาดในการเลือกไฟล์');
        } finally {
            setUploading(false);
        }
    };

    const handleExportStudents = async () => {
        setExporting(true);
        setError(null);
        try {
            if (!courseId) {
                throw new Error('ไม่พบรหัสรายวิชา');
            }

            console.log('Export students from course:', courseId);


            if (courseDetail) {
                await exportStudentToCourse(courseId, courseDetail.courseCode);
            } else {
                throw new Error('ไม่พบข้อมูลรายวิชา');
            }

            setSuccess('ส่งออกข้อมูลนักเรียนสำเร็จ');

        } catch (error: any) {
            setError(error.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูลนักเรียน');
        } finally {
            setExporting(false);
        }
    };

    const handleBack = () => {
        router.push(paths.dashboard.course);
    };

    const handleCloseErrorDialog = () => {
        setErrorDialogMessage('');
        router.push(paths.dashboard.course);
    };

    // Show loading state
    if (loadingCourse) {
        return (
            <Box sx={{ py: 3 }}>
                <Stack spacing={3}>
                    <Box>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <IconButton onClick={handleBack} size="small">
                                <ArrowLeftIcon size={20} />
                            </IconButton>
                            <Skeleton variant="text" width={300} height={40} />
                        </Stack>
                        <Skeleton variant="text" width={200} height={24} />
                    </Box>

                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width={400} height={32} />
                            <Skeleton variant="text" width={200} height={24} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Skeleton variant="text" width={250} height={32} />
                                <Skeleton variant="rectangular" width="100%" height={200} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        );
    }

    // Show error if no course found
    if (!courseDetail) {
        return (
            <>
                <Box sx={{ py: 3 }}>
                    <Alert severity="error">
                        ไม่พบข้อมูลรายวิชา
                    </Alert>
                </Box>
                <ErrorDialog
                    open={Boolean(errorDialogMessage)}
                    message={errorDialogMessage}
                    onClose={handleCloseErrorDialog}
                />
            </>
        );
    }

    return (
        <Box sx={{ py: 3 }}>
            <Stack spacing={3}>
                {/* Header */}
                <Box>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <IconButton onClick={handleBack} size="small">
                            <ArrowLeftIcon size={20} />
                        </IconButton>
                        <Typography variant="h4">
                            จัดการนักเรียนในรายวิชา
                        </Typography>
                    </Stack>

                    <Breadcrumbs>
                        <Link
                            color="inherit"
                            href={paths.dashboard.course}
                            onClick={(e) => {
                                e.preventDefault();
                                handleBack();
                            }}
                            sx={{ cursor: 'pointer' }}
                        >
                            จัดการรายวิชา
                        </Link>
                        <Typography color="text.primary">เพิ่มนักเรียน</Typography>
                    </Breadcrumbs>
                </Box>

                {/* Course Info Card */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            รายวิชา: {courseDetail.courseCode}: {courseDetail.courseName}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                ปีการศึกษา: {courseDetail.academicYear}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ภาคเรียนที่: {courseDetail.semester}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ห้องเรียน: {courseDetail.room}
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Import/Export Section */}
                <Card>
                    <CardContent>
                        <Stack spacing={3}>
                            <Typography variant="h6">
                                นำเข้า/ส่งออกข้อมูลผู้เรียน
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Button
                                    color="inherit"
                                    startIcon={
                                        uploading ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <UploadIcon fontSize="var(--icon-fontSize-md)" />
                                        )
                                    }
                                    onClick={handleImportStudents}
                                    disabled={uploading || exporting}
                                >
                                    {uploading ? 'กำลังนำเข้า...' : 'Import'}
                                </Button>

                                <Button
                                    color="inherit"
                                    startIcon={
                                        exporting ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <DownloadIcon fontSize="var(--icon-fontSize-md)" />
                                        )
                                    }
                                    onClick={handleExportStudents}
                                    disabled={uploading || exporting || students.length === 0}
                                >
                                    {exporting ? 'กำลังส่งออก...' : 'Export'}
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Success/Error Messages */}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Students Table */}
                <Card>
                    <CardContent>
                        <Stack spacing={2}>
                            <Typography variant="h6">
                                รายชื่อผู้เรียน ({students.length} คน)
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                                                ลำดับที่
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                รหัสนักศึกษา
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                ชื่อ - นามสกุล (ภาษาไทย)
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                ชื่อ - นามสกุล (ภาษาอังกฤษ)
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        ยังไม่มีข้อมูลนักเรียน
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            students
                                                .sort((a, b) => a.studentId - b.studentId)
                                                .map((student, index) => (
                                                    <TableRow key={student.studentId} hover>
                                                        <TableCell align="center">
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {index + 1}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {student.studentNo}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {student.studentNameTh}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {student.studentNameEn}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </CardContent>
                </Card>
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