'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Metadata } from 'next';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertColor } from "@mui/material/Alert";
import CircularProgress from '@mui/material/CircularProgress';

import { getCourses } from '@/api/course-api';
import { CourseResponse, CourseFilter, DayOfWeek } from '@/api/data/course-response';
import { CoursesTable } from '@/components/dashboard/course/course-table';
import ErrorDialog from '@/components/error/error-dialog';
import { paths } from '@/paths';

export default function Page(): React.JSX.Element {
  const router = useRouter();
  const page = 0;
  const rowsPerPage = 10;

  // Course state
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);

  // Filter state
  const [academicYear, setAcademicYear] = useState<number>(2568);
  const [semester, setSemester] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dialog state
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch courses function
  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const filter: CourseFilter = {
        academicYear,
        semester,
        ...(selectedDay && { dayOfWeek: selectedDay as DayOfWeek }),
        ...(searchTerm.trim() && { search: searchTerm.trim() })
      };

      console.log('Fetching courses with filter:', filter);

      const response = await getCourses(filter);
      
      if (response.success) {
        setCourses(response.data);
        setTotalCourses(response.total);
        console.log(`Loaded ${response.data.length} courses`);
      } else {
        setErrorMessage(response.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา');
        setCourses([]);
        setTotalCourses(0);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setErrorMessage((error as Error).message);
      setCourses([]);
      setTotalCourses(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchCourses();
  }, [academicYear, semester, selectedDay, searchTerm]);

  // Handle filter changes
  const handleAcademicYearChange = (event: SelectChangeEvent<number>) => {
    setAcademicYear(Number(event.target.value));
  };

  const handleSemesterChange = (event: SelectChangeEvent<number>) => {
    setSemester(Number(event.target.value));
  };

  const handleDayChange = (event: SelectChangeEvent<string>) => {
    setSelectedDay(event.target.value as DayOfWeek | '');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Reset filters
  const handleResetFilters = () => {
    setAcademicYear(2568);
    setSemester(2);
    setSelectedDay('');
    setSearchTerm('');
  };

  // Navigate to create course page
  const handleCreateCourse = () => {
    router.push(paths.dashboard.createCourse);
  };

  // Toast handlers
  const showToast = (message: string, severity: AlertColor = "success") => {
    setToast({ open: true, message, severity });
  };

  // Error dialog close handler
  const handleCloseErrorDialog = () => {
    setErrorMessage(null);
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
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

  const Alert = React.forwardRef<HTMLDivElement, { severity: AlertColor; children: React.ReactNode }>(
    function Alert(props, ref) {
      return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    }
  );

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">ข้อมูลรายวิชา</Typography>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            onClick={handleCreateCourse}
          >
            เพิ่มรายวิชา
          </Button>
        </div>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>ปีการศึกษา</InputLabel>
          <Select value={academicYear} onChange={handleAcademicYearChange} label="ปีการศึกษา">
            <MenuItem value={2567}>2567</MenuItem>
            <MenuItem value={2568}>2568</MenuItem>
            <MenuItem value={2569}>2569</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>ภาคเรียน</InputLabel>
          <Select value={semester} onChange={handleSemesterChange} label="ภาคเรียน">
            <MenuItem value={1}>ภาคเรียนที่ 1</MenuItem>
            <MenuItem value={2}>ภาคเรียนที่ 2</MenuItem>
          </Select>
        </FormControl>

        {loading && <CircularProgress size={20} />}
      </Stack>

      {/* Course Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'กำลังโหลด...' : `พบรายวิชาทั้งหมด ${totalCourses} รายการ`}
        </Typography>
      </Box>

      {/* Courses Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              กำลังโหลดรายวิชา...
            </Typography>
          </Stack>
        </Box>
      ) : courses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ไม่พบรายวิชา
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || selectedDay 
              ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง' 
              : `ไม่มีรายวิชาในปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`
            }
          </Typography>
        </Box>
      ) : (
        <CoursesTable
          count={totalCourses}
          page={page}
          rows={courses}
          rowsPerPage={courses.length}
          onUpdated={fetchCourses}
          onError={setErrorMessage}
        />
      )}


      {/* Error Dialog */}
      <ErrorDialog
        open={Boolean(errorMessage)}
        message={errorMessage}
        onClose={handleCloseErrorDialog}
      />

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={toast.severity}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}