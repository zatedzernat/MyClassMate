'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { AlertColor } from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { FloppyDiskIcon } from '@phosphor-icons/react/dist/ssr/FloppyDisk';
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';

import { CourseRequest, CourseResponse, DayOfWeek, UpdateCourseRequest } from '@/api/data/course-response';
import { paths } from '@/paths';
import { getCourseById, updateCourse } from '@/api/course-api';
import ErrorDialog from '@/components/error/error-dialog';

// Add imports for lecturers
import { getUsers } from '@/api/user-api';
import { UserResponse } from '@/api/data/user-response';
import { Role } from '@/util/role-enum';
import { CreateCourseRequest } from '@/api/data/course-create';

export default function Page(): React.JSX.Element {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');

    // Form state
    const [formData, setFormData] = useState<UpdateCourseRequest>({
        courseCode: '',
        courseName: '',
        academicYear: 2568,
        semester: 1,
        room: '',
        schedules: [],
        lecturerIds: [],
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingCourse, setLoadingCourse] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);

    // Course data state
    const [originalCourse, setOriginalCourse] = useState<CourseResponse | null>(null);
    const [schedules, setSchedules] = useState<any[]>([]);

    // Add state for lecturers
    const [lecturers, setLecturers] = useState<UserResponse[]>([]);
    const [selectedLecturers, setSelectedLecturers] = useState<Set<number>>(new Set());
    const [loadingLecturers, setLoadingLecturers] = useState(false);

    // Add new state for schedule editing dialog
    const [editScheduleDialog, setEditScheduleDialog] = useState({
        open: false,
        index: -1,
        schedule: null as any
    });

    // Add state to track changes
    const [hasChanges, setHasChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    // Function to check if form data has changed from original
    const checkForChanges = (): boolean => {
        if (!originalCourse) return false;

        // Check basic form data changes
        const formChanged = (
            formData.courseCode !== originalCourse.courseCode ||
            formData.courseName !== originalCourse.courseName ||
            formData.academicYear !== originalCourse.academicYear ||
            formData.semester !== originalCourse.semester ||
            formData.room !== originalCourse.room
        );

        // Check lecturer changes
        const originalLecturerIds = new Set(originalCourse.lecturers?.map(l => Number(l.lecturerId)) || []);
        const currentLecturerIds = selectedLecturers;
        const lecturersChanged = (
            originalLecturerIds.size !== currentLecturerIds.size ||
            [...originalLecturerIds].some(id => !currentLecturerIds.has(id))
        );

        // Check schedule changes
        const originalSchedules = originalCourse.schedules || [];
        const schedulesChanged = (
            schedules.length !== originalSchedules.length ||
            schedules.some((schedule, index) => {
                const original = originalSchedules[index];
                return !original || (
                    schedule.scheduleDate !== original.scheduleDate ||
                    schedule.startTime !== original.startTime ||
                    schedule.endTime !== original.endTime ||
                    schedule.room !== original.room ||
                    (schedule.remark || '') !== (original.remark || '')
                );
            })
        );

        return formChanged || lecturersChanged || schedulesChanged;
    };

    // Function to check if form is valid
    const isFormValid = (): boolean => {
        // Check required fields
        const requiredFieldsValid = (
            formData.courseCode.trim() !== '' &&
            formData.courseName.trim() !== '' &&
            formData.room.trim() !== '' &&
            selectedLecturers.size > 0
        );

        // Check schedules validation
        const schedulesValid = schedules.length === 0 || schedules.every(schedule => {
            // Each schedule must have required fields
            const hasRequiredFields = (
                schedule.scheduleDate &&
                schedule.scheduleDate.trim() !== '' &&
                schedule.startTime &&
                schedule.startTime.trim() !== '' &&
                schedule.endTime &&
                schedule.endTime.trim() !== '' &&
                schedule.room &&
                schedule.room.trim() !== ''
            );



            return hasRequiredFields
        });

        return requiredFieldsValid && schedulesValid;
    };
    // Function to check if button should be enabled
    const isButtonEnabled = (): boolean => {
        return !loading && hasChanges && isFormValid();
    };

    // Function to get button tooltip text
    const getButtonTooltip = (): string => {
        if (loading) return 'กำลังบันทึกข้อมูล...';
        if (!isFormValid()) return 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง';
        if (!hasChanges) return 'ไม่มีการเปลี่ยนแปลงข้อมูล';
        return 'บันทึกการแก้ไข';
    };

    // Fetch course data
    const fetchCourse = async (id: string) => {
        try {
            setLoadingCourse(true);
            const course = await getCourseById(id);

            if (course) {
                setOriginalCourse(course);
                setFormData({
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    academicYear: course.academicYear,
                    semester: course.semester,
                    room: course.room,
                    schedules: course.schedules,
                    lecturerIds: course.lecturers.map(lecturer => Number(lecturer.lecturerId)),
                });

                setSchedules(course.schedules || []);

                // Set selected lecturers
                if (course.lecturers) {
                    const lecturerIds = course.lecturers.map(l => Number(l.lecturerId));
                    setSelectedLecturers(new Set(lecturerIds));
                }
            }
        } catch (error: any) {
            setErrorDialogMessage(error.message || 'ไม่สามารถดึงข้อมูลรายวิชาได้');
        } finally {
            setLoadingCourse(false);
        }
    };

    // Fetch lecturers function
    const fetchLecturers = async () => {
        try {
            setLoadingLecturers(true);
            const response = await getUsers(Role.LECTURER);
            setLecturers(response);
        } catch (error: any) {
            setErrorDialogMessage(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลอาจารย์ผู้สอน');
        } finally {
            setLoadingLecturers(false);
        }
    };

    // Validation function
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.courseCode.trim()) {
            newErrors.courseCode = 'กรุณากรอกรหัสวิชา';
        } else if (!/^[A-Z]{2}[0-9]{4}$/.test(formData.courseCode)) {
            newErrors.courseCode = 'รหัสวิชาต้องเป็นรูปแบบ XX0000 (เช่น CU0001)';
        }

        if (!formData.courseName.trim()) {
            newErrors.courseName = 'กรุณากรอกชื่อวิชา';
        }

        if (!formData.room.trim()) {
            newErrors.room = 'กรุณากรอกห้องเรียน';
        }

        if (selectedLecturers.size === 0) {
            newErrors.lecturers = 'กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คน';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (field: keyof CourseRequest) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
    ) => {
        const value = event.target.value;
        setFormData(prev => {
            const newFormData = {
                ...prev,
                [field]: value
            };

            setHasChanges(checkForChanges());

            return newFormData;
        });

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle form submission - Update course
    const handleUpdateCourse = async (event?: React.FormEvent) => {
        if (event) event.preventDefault();

        if (!validateForm()) {
            showToast('กรุณาตรวจสอบข้อมูลที่กรอก', 'error');
            return;
        }

        if (!originalCourse) {
            showToast('ไม่พบข้อมูลรายวิชาที่ต้องการแก้ไข', 'error');
            return;
        }

        setLoading(true);

        try {
            // Prepare the update course request data
            const courseData: UpdateCourseRequest = {
                courseCode: formData.courseCode,
                courseName: formData.courseName,
                academicYear: formData.academicYear,
                semester: formData.semester,
                room: formData.room,
                schedules: schedules.map(schedule => ({
                    courseScheduleId: schedule.courseScheduleId || null, // Ensure courseScheduleId is included
                    courseId: Number(originalCourse.courseId), // Convert courseId to a number
                    scheduleDate: schedule.scheduleDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    room: schedule.room,
                    remark: schedule.remark || undefined
                })),
                lecturerIds: Array.from(selectedLecturers),
            };

            console.log('Updating course with data:', courseData);

            // Call the update course API
            const result = await updateCourse(originalCourse.courseId, courseData);
            console.log('Course updated successfully');

            // Reset changes flag
            setHasChanges(false);

            // Navigate back to course list after short delay
            setTimeout(() => {
                router.push(paths.dashboard.course);
            }, 2000);



        } catch (error: any) {
            console.error('Error updating course:', error);

            let errorMessage = 'เกิดข้อผิดพลาดในการอัปเดตรายวิชา';

            if (error.message) {
                if (error.message.includes('duplicate') || error.message.includes('409')) {
                    errorMessage = `รหัสวิชา ${formData.courseCode} มีอยู่แล้วในระบบ กรุณาใช้รหัสวิชาอื่น`;
                } else if (error.message.includes('400')) {
                    errorMessage = 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง';
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
                } else {
                    errorMessage = error.message;
                }
            }

            showToast(errorMessage, 'error');

            if (error.message.length > 100) {
                setErrorDialogMessage(error.message);
            }

        } finally {
            setLoading(false);
        }
    };

    // Function to reset changes
    const handleResetChanges = () => {
        if (originalCourse) {
            // Reset form data
            setFormData({
                courseCode: originalCourse.courseCode,
                courseName: originalCourse.courseName,
                academicYear: originalCourse.academicYear,
                semester: originalCourse.semester,
                room: originalCourse.room,
                schedules: originalCourse.schedules,
                lecturerIds: originalCourse.lecturers.map(lecturer => Number(lecturer.lecturerId)),
            });

            // Reset selected lecturers
            if (originalCourse.lecturers) {
                const lecturerIds = originalCourse.lecturers.map(l => Number(l.lecturerId));
                setSelectedLecturers(new Set(lecturerIds));
            }

            // Reset schedules
            setSchedules(originalCourse.schedules || []);

            // Clear errors
            setErrors({});

            // Reset changes flag
            setHasChanges(false);

            showToast('ยกเลิกการเปลี่ยนแปลงแล้ว', 'info');
        }
    };

    // Handle back navigation
    const handleBack = () => {
        if (hasChanges) {
            setShowUnsavedDialog(true);
        } else {
            router.push(paths.dashboard.course);
        }
    };

    // Function to close error dialog
    const handleCloseErrorDialog = () => {
        setErrorDialogMessage(null);
    };

    // Toast functions
    const showToast = (message: string, severity: AlertColor = 'success') => {
        setToast({ open: true, message, severity });
    };

    const handleCloseToast = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    // Function to open edit schedule dialog
    const handleEditScheduleRow = (index: number, schedule: any) => {
        setEditScheduleDialog({
            open: true,
            index,
            schedule: { ...schedule }
        });
    };

    // Function to close edit schedule dialog
    const handleCloseEditScheduleDialog = () => {
        setEditScheduleDialog({
            open: false,
            index: -1,
            schedule: null
        });
    };

    // Function to save edited schedule
    const handleSaveEditedSchedule = () => {
        if (editScheduleDialog.index >= 0 && editScheduleDialog.schedule) {
            const newSchedules = [...schedules];
            newSchedules[editScheduleDialog.index] = editScheduleDialog.schedule;
            setSchedules(newSchedules);
            handleCloseEditScheduleDialog();
            showToast('แก้ไขตารางเรียนสำเร็จ', 'success');
            setHasChanges(checkForChanges());
        }
    };

    // Function to update edited schedule data
    const handleEditScheduleChange = (field: string, value: string) => {
        setEditScheduleDialog(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [field]: value
            }
        }));
    };

    // Get day labels in Thai
    const getDayLabel = (day: DayOfWeek): string => {
        const dayLabels = {
            [DayOfWeek.MONDAY]: 'จันทร์',
            [DayOfWeek.TUESDAY]: 'อังคาร',
            [DayOfWeek.WEDNESDAY]: 'พุธ',
            [DayOfWeek.THURSDAY]: 'พฤหัสบดี',
            [DayOfWeek.FRIDAY]: 'ศุกร์',
            [DayOfWeek.SATURDAY]: 'เสาร์',
            [DayOfWeek.SUNDAY]: 'อาทิตย์'
        };
        return dayLabels[day] || day;
    };

    // Handle lecturer selection
    const handleLecturerToggle = (lecturerId: number) => {
        setSelectedLecturers((prev: Set<number>) => {
            const newSet: Set<number> = new Set(prev);
            if (newSet.has(lecturerId)) {
                newSet.delete(lecturerId);
            } else {
                newSet.add(lecturerId);
            }
            setHasChanges(checkForChanges());
            return newSet;
        });

        // Clear lecturer error when user selects/deselects
        if (errors.lecturers) {
            setErrors(prev => ({
                ...prev,
                lecturers: ''
            }));
        }
    };

    // Handle select all lecturers
    const handleSelectAllLecturers = () => {
        setSelectedLecturers((prev: Set<number>) => {
            const newSet: Set<number> = prev.size === lecturers.length
                ? new Set<number>()
                : new Set<number>(lecturers.map(lecturer => Number(lecturer.userId)));

            setHasChanges(checkForChanges());
            return newSet;
        });
    };

    // Load course and lecturers on component mount
    useEffect(() => {
        if (courseId) {
            fetchCourse(courseId);
        } else {
            setErrorDialogMessage('ไม่พบรหัสรายวิชาที่ต้องการแก้ไข');
            setLoadingCourse(false);
        }
        fetchLecturers();
    }, [courseId]);

    // Check for changes when data is loaded
    useEffect(() => {
        if (originalCourse) {
            setHasChanges(checkForChanges());
        }
    }, [originalCourse, formData, selectedLecturers, schedules]);

    // Show loading spinner while fetching course data
    if (loadingCourse) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>กำลังโหลดข้อมูลรายวิชา...</Typography>
            </Box>
        );
    }

    // Show error if no course found
    if (!originalCourse) {
        return (
            <Box sx={{ py: 3 }}>
                <Alert severity="error">
                    ไม่พบข้อมูลรายวิชาที่ต้องการแก้ไข กรุณาตรวจสอบรหัสรายวิชาหรือลองใหม่อีกครั้ง
                </Alert>
                <Button onClick={handleBack} sx={{ mt: 2 }}>
                    กลับสู่หน้ารายการรายวิชา
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 3 }}>
            <Stack spacing={3}>
                {/* Header */}
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton onClick={handleBack} size="large">
                            <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                        </IconButton>
                        <Box>
                            <Typography variant="h4">แก้ไขรายวิชา</Typography>
                            <Typography color="text.secondary">
                                แก้ไขข้อมูลรายวิชา {originalCourse.courseCode}: {originalCourse.courseName}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2}>
                        {hasChanges && (
                            <Tooltip title="ยกเลิกการเปลี่ยนแปลงทั้งหมดและกลับสู่ข้อมูลเดิม">
                                <Button
                                    variant="outlined"
                                    onClick={handleResetChanges}
                                    disabled={loading}
                                    size="large"
                                    color="warning"
                                    startIcon={<ArrowClockwiseIcon />}
                                >
                                    ยกเลิกการเปลี่ยนแปลง
                                </Button>
                            </Tooltip>
                        )}

                        <Tooltip title={getButtonTooltip()}>
                            <span>
                                <Button
                                    variant="contained"
                                    onClick={handleUpdateCourse}
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FloppyDiskIcon />}
                                    disabled={!isButtonEnabled()}
                                    size="large"
                                    sx={{
                                        minWidth: 200,
                                        // Visual feedback for different states
                                        ...((!hasChanges || !isFormValid()) && {
                                            '&.Mui-disabled': {
                                                backgroundColor: 'grey.300',
                                                color: 'grey.500'
                                            }
                                        }),
                                        // Green color when enabled and has changes
                                        ...(isButtonEnabled() && {
                                            backgroundColor: 'success.main',
                                            '&:hover': {
                                                backgroundColor: 'success.dark'
                                            }
                                        })
                                    }}
                                >
                                    {loading ? 'กำลังบันทึก...' : hasChanges ? 'บันทึกการแก้ไข' : 'ไม่มีการเปลี่ยนแปลง'}
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Unsaved Changes Alert */}
                {hasChanges && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            🔄 คุณมีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก
                        </Typography>
                    </Alert>
                )}

                {/* Course Preview Card */}
                <Card sx={{ border: '2px dashed', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
                    <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <CalendarIcon fontSize="var(--icon-fontSize-lg)" />
                            <Box>
                                <Typography variant="h6">
                                    {formData.courseCode}: {formData.courseName}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Chip label={`ปีการศึกษา ${formData.academicYear}`} size="small" />
                                    <Chip label={`ภาคเรียนที่ ${formData.semester}`} size="small" />
                                    {formData.room && <Chip label={`ห้อง ${formData.room}`} size="small" />}
                                    {selectedLecturers.size > 0 && (
                                        <Chip
                                            label={`อาจารย์ ${selectedLecturers.size} คน`}
                                            size="small"
                                            color="secondary"
                                        />
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <Card>
                    <CardHeader title="ข้อมูลรายวิชา" />
                    <Divider />
                    <CardContent>
                        <form onSubmit={handleUpdateCourse}>
                            <Stack spacing={3}>
                                {/* Basic Information */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>ข้อมูลพื้นฐาน</Typography>
                                    <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <TextField
                                                label="รหัสวิชา"
                                                placeholder="เช่น CU0001"
                                                value={formData.courseCode}
                                                onChange={handleInputChange('courseCode')}
                                                error={Boolean(errors.courseCode)}
                                                helperText={errors.courseCode || 'รูปแบบ: XX0000 (ตัวอักษร 2 ตัว + ตัวเลข 4 ตัว)'}
                                                fullWidth
                                                required
                                                inputProps={{ style: { textTransform: 'uppercase' } }}
                                            />

                                            <TextField
                                                label="ชื่อวิชา"
                                                placeholder="เช่น การเขียนโปรแกรมคอมพิวเตอร์"
                                                value={formData.courseName}
                                                onChange={handleInputChange('courseName')}
                                                error={Boolean(errors.courseName)}
                                                helperText={errors.courseName}
                                                fullWidth
                                                required
                                            />
                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <FormControl fullWidth required>
                                                <InputLabel>ปีการศึกษา</InputLabel>
                                                <Select
                                                    value={formData.academicYear}
                                                    onChange={handleInputChange('academicYear')}
                                                    label="ปีการศึกษา"
                                                >
                                                    <MenuItem value={2567}>2567</MenuItem>
                                                    <MenuItem value={2568}>2568</MenuItem>
                                                    <MenuItem value={2569}>2569</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <FormControl fullWidth required>
                                                <InputLabel>ภาคเรียน</InputLabel>
                                                <Select
                                                    value={formData.semester}
                                                    onChange={handleInputChange('semester')}
                                                    label="ภาคเรียน"
                                                >
                                                    <MenuItem value={1}>ภาคเรียนที่ 1</MenuItem>
                                                    <MenuItem value={2}>ภาคเรียนที่ 2</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Divider />

                                {/* Schedule Information */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>ตารางเรียน</Typography>
                                    <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <TextField
                                                label="ห้องเรียน"
                                                placeholder="เช่น 108/8"
                                                value={formData.room}
                                                onChange={handleInputChange('room')}
                                                error={Boolean(errors.room)}
                                                helperText={errors.room}
                                                fullWidth
                                                required
                                            />

                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>

                {/* Existing Schedules */}
                {schedules.length > 0 && (
                    <Card>
                        <CardHeader
                            title="ตารางเรียนปัจจุบัน"
                            subheader={`จำนวน ${schedules.length} ครั้ง`}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ครั้งที่</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>วันที่มีการเรียนการสอน</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>เวลาเริ่ม</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>เวลาสิ้นสุด</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ห้องเรียน</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>หมายเหตุ</th>
                                            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.map((schedule, index) => (
                                            <tr
                                                key={index}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                                                }}
                                                onDoubleClick={() => handleEditScheduleRow(index, schedule)}
                                            >
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{index + 1}</td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {new Date(schedule.scheduleDate).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        weekday: 'long'
                                                    })}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {schedule.startTime.substring(0, 5)}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {schedule.endTime.substring(0, 5)}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{schedule.room}</td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {schedule.remark || '-'}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleEditScheduleRow(index, schedule)}
                                                    >
                                                        แก้ไข
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Lecturer Selection */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        เลือกอาจารย์ผู้สอน
                        {errors.lecturers && (
                            <Typography component="span" color="error" sx={{ fontSize: '0.75rem', ml: 1 }}>
                                *{errors.lecturers}
                            </Typography>
                        )}
                    </Typography>

                    {loadingLecturers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : lecturers.length === 0 ? (
                        <Alert severity="info">
                            ไม่พบข้อมูลอาจารย์ในระบบ
                        </Alert>
                    ) : (
                        <Card variant="outlined" sx={{ border: errors.lecturers ? '1px solid #d32f2f' : undefined }}>
                            <CardContent>
                                {/* Summary */}
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        เลือกแล้ว {selectedLecturers.size} จาก {lecturers.length} คน
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={handleSelectAllLecturers}
                                        variant={selectedLecturers.size === lecturers.length ? "outlined" : "text"}
                                    >
                                        {selectedLecturers.size === lecturers.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                    </Button>
                                </Box>

                                {/* Selected Lecturers Preview */}
                                {selectedLecturers.size > 0 && (
                                    <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                                        <Typography variant="subtitle2" gutterBottom color="success.main">
                                            อาจารย์ที่เลือก:
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {lecturers
                                                .filter(lecturer => selectedLecturers.has(Number(lecturer.userId)))
                                                .map(lecturer => (
                                                    <Chip
                                                        key={lecturer.userId}
                                                        label={`${lecturer.nameTh} (${lecturer.nameEn})`}
                                                        color="success"
                                                        size="small"
                                                        onDelete={() => handleLecturerToggle(Number(lecturer.userId))}
                                                    />
                                                ))
                                            }
                                        </Stack>
                                    </Box>
                                )}

                                {/* Lecturers Table */}
                                <Box sx={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '60px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLecturers.size === lecturers.length && lecturers.length > 0}
                                                        onChange={handleSelectAllLecturers}
                                                        style={{ transform: 'scale(1.2)' }}
                                                    />
                                                </th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ชื่อ - นามสกุลภาษาไทย</th>
                                                <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ชื่อ - นามสกุลภาษาอังกฤษ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lecturers.map((lecturer, index) => {
                                                const isSelected = selectedLecturers.has(Number(lecturer.userId));
                                                return (
                                                    <tr
                                                        key={lecturer.userId}
                                                        style={{
                                                            backgroundColor: isSelected ? '#e8f5e8' : (index % 2 === 0 ? '#ffffff' : '#fafafa'),
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleLecturerToggle(Number(lecturer.userId))}
                                                    >
                                                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleLecturerToggle(Number(lecturer.userId))}
                                                                style={{ transform: 'scale(1.2)' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </td>
                                                        <td style={{
                                                            padding: '12px',
                                                            border: '1px solid #ddd',
                                                            fontWeight: isSelected ? 'bold' : 'normal',
                                                            color: isSelected ? '#2e7d32' : 'inherit'
                                                        }}>
                                                            {lecturer.nameTh}
                                                        </td>
                                                        <td style={{
                                                            padding: '12px',
                                                            border: '1px solid #ddd',
                                                            fontWeight: isSelected ? 'bold' : 'normal',
                                                            color: isSelected ? '#2e7d32' : 'inherit'
                                                        }}>
                                                            {lecturer.nameEn}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </Box>

                                {/* Lecturer Stats */}
                                <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        💡 คลิกที่แถวเพื่อเลือกอาจารย์ หรือใช้ checkbox • ท่านสามารถเลือกอาจารย์ได้หลายคน
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Box>

                {/* Edit Schedule Dialog */}
                <Dialog
                    open={editScheduleDialog.open}
                    onClose={handleCloseEditScheduleDialog}
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle>
                        แก้ไขตารางเรียน ครั้งที่ {editScheduleDialog.index + 1}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="วันที่เรียน"
                                type="date"
                                value={editScheduleDialog.schedule?.scheduleDate || ''}
                                onChange={(e) => handleEditScheduleChange('scheduleDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="เวลาเริ่ม"
                                    type="time"
                                    value={editScheduleDialog.schedule?.startTime?.substring(0, 5) || ''}
                                    onChange={(e) => handleEditScheduleChange('startTime', e.target.value + ':00')}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />

                                <TextField
                                    label="เวลาสิ้นสุด"
                                    type="time"
                                    value={editScheduleDialog.schedule?.endTime?.substring(0, 5) || ''}
                                    onChange={(e) => handleEditScheduleChange('endTime', e.target.value + ':00')}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Stack>

                            <TextField
                                label="ห้องเรียน"
                                value={editScheduleDialog.schedule?.room || ''}
                                onChange={(e) => handleEditScheduleChange('room', e.target.value)}
                                fullWidth
                            />

                            <TextField
                                label="หมายเหตุ"
                                value={editScheduleDialog.schedule?.remark || ''}
                                onChange={(e) => handleEditScheduleChange('remark', e.target.value)}
                                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                fullWidth
                                multiline
                                rows={3}
                            />

                            {/* Preview updated schedule */}
                            {editScheduleDialog.schedule && (
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>ตัวอย่าง:</Typography>
                                    <Typography variant="body2">
                                        วันที่: {editScheduleDialog.schedule.scheduleDate &&
                                            new Date(editScheduleDialog.schedule.scheduleDate).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                weekday: 'long'
                                            })
                                        }
                                    </Typography>
                                    <Typography variant="body2">
                                        เวลา: {editScheduleDialog.schedule.startTime?.substring(0, 5)} - {editScheduleDialog.schedule.endTime?.substring(0, 5)}
                                    </Typography>
                                    <Typography variant="body2">
                                        ห้อง: {editScheduleDialog.schedule.room}
                                    </Typography>
                                    {editScheduleDialog.schedule.remark && (
                                        <Typography variant="body2">
                                            หมายเหตุ: {editScheduleDialog.schedule.remark}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEditScheduleDialog}>
                            ยกเลิก
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveEditedSchedule}
                        >
                            บันทึกการแก้ไข
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Unsaved Changes Dialog */}
                <Dialog open={showUnsavedDialog} onClose={() => setShowUnsavedDialog(false)}>
                    <DialogTitle>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</DialogTitle>
                    <DialogContent>
                        <Typography>
                            คุณมีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก หากออกจากหน้านี้การเปลี่ยนแปลงจะหายไป
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowUnsavedDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button
                            color="warning"
                            onClick={() => {
                                setShowUnsavedDialog(false);
                                router.push(paths.dashboard.course);
                            }}
                        >
                            ออกโดยไม่บันทึก
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setShowUnsavedDialog(false);
                                handleUpdateCourse();
                            }}
                        >
                            บันทึกและออก
                        </Button>
                    </DialogActions>
                </Dialog>

            </Stack>

            {/* Error Dialog */}
            <ErrorDialog
                open={Boolean(errorDialogMessage)}
                message={errorDialogMessage}
                onClose={handleCloseErrorDialog}
            />

            {/* Toast Notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ zIndex: 9999 }}
            >
                <Alert onClose={handleCloseToast} severity={toast.severity}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}