'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { CourseRequest, DayOfWeek } from '@/api/data/course-response';
import { paths } from '@/paths';
import { courseInit, createCourse } from '@/api/course-api';
import ErrorDialog from '@/components/error/error-dialog';

// Add imports at the top
import { getUsers } from '@/api/user-api';
import { UserResponse } from '@/api/data/user-response';
import { Role } from '@/util/role-enum';
import { CreateCourseRequest } from '@/api/data/course-create';



export default function Page(): React.JSX.Element {
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState<CourseRequest>({
        courseCode: '',
        courseName: '',
        academicYear: 2568,
        semester: 1,
        room: '',
        startTime: '09:00:00',
        endTime: '12:00:00',
        dayOfWeek: DayOfWeek.MONDAY,
        startDate: '',
        endDate: ''
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);

    // Add state for lecturers
    const [lecturers, setLecturers] = useState<UserResponse[]>([]);
    const [selectedLecturers, setSelectedLecturers] = useState<Set<number>>(new Set());
    const [loadingLecturers, setLoadingLecturers] = useState(false);


    // Add state for schedule preview
    const [schedulePreview, setSchedulePreview] = useState<any[]>([]);
    const [showSchedulePreview, setShowSchedulePreview] = useState(false);

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

    // Also update the validation function to include lecturer validation
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

        if (!formData.startDate) {
            newErrors.startDate = 'กรุณาเลือกวันที่เริ่มเรียน';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'กรุณาเลือกวันที่เรียนจบ';
        }

        if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
            newErrors.endDate = 'วันที่เรียนจบต้องมากกว่าวันที่เริ่มเรียน';
        }

        if (formData.startTime >= formData.endTime) {
            newErrors.endTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form input changes
    const handleInputChange = (field: keyof CourseRequest) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
    ) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Handle form submission
    const handleCreateSchedulePreview = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) {
            showToast('กรุณาตรวจสอบข้อมูลที่กรอก', 'error');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Call courseInit API to preview schedule
            console.log('Generating course schedule preview...');

            const initRequest = {
                dayOfWeek: formData.dayOfWeek,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                room: formData.room
            };

            const initResponse = await courseInit(initRequest);

            // Step 2: Show schedule preview
            setSchedulePreview(initResponse.data);
            setShowSchedulePreview(true);
        } catch (error: any) {
            setErrorDialogMessage(error.message || 'เกิดข้อผิดพลาดในการสร้างตารางเรียน');
        } finally {
            setLoading(false);
        }
    };

    // Update the handleConfirmCreate function
    const handleConfirmCreate = async () => {
        // Validate lecturer selection first
        if (selectedLecturers.size === 0) {
            showToast('กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คน', 'warning');
            return;
        }

        setLoading(true);

        try {
            // Get current user ID from localStorage (you might need to adjust this based on your auth system)
            const currentUserId = Number(localStorage.getItem('user-id')) || 1;

            // Prepare the create course request data
            const courseData: CreateCourseRequest = {
                courseCode: formData.courseCode,
                courseName: formData.courseName,
                academicYear: formData.academicYear,
                semester: formData.semester,
                room: formData.room,
                startTime: formData.startTime,
                endTime: formData.endTime,
                dayOfWeek: formData.dayOfWeek,
                startDate: formData.startDate,
                endDate: formData.endDate,
                createdBy: currentUserId,
                lecturerIds: Array.from(selectedLecturers),
                schedules: schedulePreview.map(schedule => ({
                    scheduleDate: schedule.scheduleDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    room: schedule.room,
                    remark: schedule.remark || undefined // Only include remark if it exists
                }))
            };

            console.log('Creating course with data:', courseData);

            // Call the create course API
            const result = await createCourse(courseData);


            // Show success message with course details
            showToast(
                `สร้างรายวิชา ${result.data.courseCode}: ${result.data.courseName} สำเร็จ`,
                'success'
            );

            console.log('Course created successfully:', result.data);

            // Navigate back to course list after short delay
            setTimeout(() => {
                router.push(paths.dashboard.course);
            }, 2000);

        } catch (error: any) {
            console.error('Error creating course:', error);
            setErrorDialogMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        router.push(paths.dashboard.course);
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

    // Add new state for schedule editing dialog
    const [editScheduleDialog, setEditScheduleDialog] = useState({
        open: false,
        index: -1,
        schedule: null as any
    });

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
            const newPreview = [...schedulePreview];
            newPreview[editScheduleDialog.index] = editScheduleDialog.schedule;
            setSchedulePreview(newPreview);
            handleCloseEditScheduleDialog();
            showToast('แก้ไขตารางเรียนสำเร็จ', 'success');
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

    // Calculate duration in hours
    const calculateDuration = (): string => {
        if (formData.startTime && formData.endTime) {
            const start = new Date(`2000-01-01T${formData.startTime}`);
            const end = new Date(`2000-01-01T${formData.endTime}`);
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return diff > 0 ? `${diff} ชั่วโมง` : '';
        }
        return '';
    };

    // Load lecturers on component mount
    useEffect(() => {
        fetchLecturers();
    }, []);

    // Handle lecturer selection
    const handleLecturerToggle = (lecturerId: number) => {
        setSelectedLecturers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lecturerId)) {
                newSet.delete(lecturerId);
            } else {
                newSet.add(lecturerId);
            }
            return newSet;
        });
    };

    // Handle select all lecturers
    const handleSelectAllLecturers = () => {
        if (selectedLecturers.size === lecturers.length) {
            setSelectedLecturers(new Set());
        } else {
            setSelectedLecturers(new Set(lecturers.map(lecturer => Number(lecturer.userId))));
        }
    };

    return (
        <Box sx={{ py: 3 }}>
            <Stack spacing={3}>
                {/* Header with conditional button */}
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton onClick={handleBack} size="large">
                            <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
                        </IconButton>
                        <Box>
                            <Typography variant="h4">เพิ่มรายวิชาใหม่</Typography>
                            <Typography color="text.secondary">
                                กรอกข้อมูลรายวิชาที่ต้องการเพิ่ม
                            </Typography>
                        </Box>
                    </Stack>

                    {showSchedulePreview && (
                        <Button
                            variant="contained"
                            onClick={handleConfirmCreate}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FloppyDiskIcon />}
                            disabled={loading || selectedLecturers.size === 0 || schedulePreview.length === 0}
                            size="large"
                            sx={{ minWidth: 200 }}
                        >
                            {loading ? 'กำลังสร้างรายวิชา...' : 'ยืนยันสร้างรายวิชา'}
                        </Button>
                    )}
                </Stack>

                {/* Course Preview Card */}
                {(formData.courseCode || formData.courseName) && (
                    <Card sx={{ border: '2px dashed', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CalendarIcon fontSize="var(--icon-fontSize-lg)" />
                                <Box>
                                    <Typography variant="h6">
                                        {formData.courseCode && formData.courseName
                                            ? `${formData.courseCode}: ${formData.courseName}`
                                            : formData.courseCode || formData.courseName || 'รายวิชาใหม่'
                                        }
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <Chip label={`ปีการศึกษา ${formData.academicYear}`} size="small" />
                                        <Chip label={`ภาคเรียนที่ ${formData.semester}`} size="small" />
                                        <Chip label={`วัน${getDayLabel(formData.dayOfWeek)}`} size="small" />
                                        {formData.startTime && formData.endTime && (
                                            <Chip
                                                label={`${formData.startTime.substring(0, 5)} - ${formData.endTime.substring(0, 5)} (${calculateDuration()})`}
                                                size="small"
                                            />
                                        )}
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
                )}

                {/* Main Form */}
                <Card>
                    <CardHeader title="ข้อมูลรายวิชา" />
                    <Divider />
                    <CardContent>
                        <form onSubmit={handleCreateSchedulePreview}>
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
                                                    <MenuItem value={3}>ภาคเรียนที่ 3</MenuItem>
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

                                            <FormControl fullWidth required>
                                                <InputLabel>วันในสัปดาห์</InputLabel>
                                                <Select
                                                    value={formData.dayOfWeek}
                                                    onChange={handleInputChange('dayOfWeek')}
                                                    label="วันในสัปดาห์"
                                                >
                                                    {Object.values(DayOfWeek).map((day) => (
                                                        <MenuItem key={day} value={day}>
                                                            วัน{getDayLabel(day)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <TextField
                                                label="เวลาเริ่ม"
                                                type="time"
                                                value={formData.startTime}
                                                onChange={handleInputChange('startTime')}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                required
                                            />

                                            <TextField
                                                label="เวลาสิ้นสุด"
                                                type="time"
                                                value={formData.endTime}
                                                onChange={handleInputChange('endTime')}
                                                error={Boolean(errors.endTime)}
                                                helperText={errors.endTime || calculateDuration()}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                required
                                            />
                                        </Stack>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <TextField
                                                label="วันที่เริ่มเรียน"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={handleInputChange('startDate')}
                                                error={Boolean(errors.startDate)}
                                                helperText={errors.startDate}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                required
                                            />

                                            <TextField
                                                label="วันที่เรียนจบ"
                                                type="date"
                                                value={formData.endDate}
                                                onChange={handleInputChange('endDate')}
                                                error={Boolean(errors.endDate)}
                                                helperText={errors.endDate}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                required
                                            />
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Divider />

                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FloppyDiskIcon />}
                                        disabled={loading}
                                        size="large"
                                    >
                                        {loading ? 'กำลังบันทึก...' : 'สร้างตารางเรียน'}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>

                {showSchedulePreview && (
                    <Card>
                        <CardHeader
                            title="ตารางเรียนที่จะสร้าง"
                            subheader={`จำนวน ${schedulePreview.length} ครั้ง`}
                        />
                        <Divider />
                        <CardContent>
                            <Stack spacing={3}>
                                {/* Enhanced Schedule Table */}
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
                                            {schedulePreview.map((schedule, index) => (
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

                                {/* Remove the Action Buttons section here since it's moved to header */}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {/* Lecturer Selection */}
                {showSchedulePreview && (
                    <Box>
                        <Typography variant="h6" gutterBottom>เลือกอาจารย์ผู้สอน</Typography>

                        {loadingLecturers ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : lecturers.length === 0 ? (
                            <Alert severity="info">
                                ไม่พบข้อมูลอาจารย์ในระบบ
                            </Alert>
                        ) : (
                            <Card variant="outlined">
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
                )}

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
            >
                <Alert onClose={handleCloseToast} severity={toast.severity}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}