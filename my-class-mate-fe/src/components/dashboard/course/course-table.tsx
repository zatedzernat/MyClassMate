'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import dayjs from 'dayjs';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { CourseResponse, DayOfWeek } from '@/api/data/course-response';
import { useRouter } from 'next/navigation';
import { deleteCourse } from '@/api/course-api';
import { paths } from '@/paths';

function noop(): void {
  // do nothing
}

interface CoursesTableProps {
  count?: number;
  page?: number;
  rows?: CourseResponse[];
  rowsPerPage?: number;
  onUpdated?: () => void;
  onError?: (message: string) => void;
}

export function CoursesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onUpdated: onUpdated,
  onError: onError,
}: CoursesTableProps): React.JSX.Element {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseResponse | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [courseDetail, setCourseDetail] = useState<CourseResponse | null>(null);

  const router = useRouter();

  // Get day label in Thai
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

  // Format time display
  const formatTime = (time: string): string => {
    return time.substring(0, 5); // Remove seconds
  };

  // Format date display
  const formatDate = (date: string): string => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  // Handle course row click
  const handleRowClick = (course: CourseResponse) => {
    setCourseDetail(course);
    setOpenDetailDialog(true);
  };

  // Replace handleOpenEditDialog with navigation function
  const handleEditCourse = (courseId: number) => {
    router.push(`${paths.dashboard.course}/edit-course?id=${courseId}`);

  };

  // Handle delete dialog
  const handleDeleteDialogOpen = (course: CourseResponse) => {
    setCourseToDelete(course);
    setOpenDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setCourseToDelete(null);
  };


  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      console.log('Deleting course:', courseToDelete.courseId);

      // Call the delete course API
      const result = await deleteCourse(courseToDelete.courseId.toString());

      // Show success message (you might want to add a toast notification here)
      console.log(`Course ${courseToDelete.courseCode} deleted successfully`);

      // Call the onUpdated callback to refresh the course list
      if (onUpdated) {
        onUpdated();
      }

    } catch (error: any) {
      console.error('Error deleting course:', error);

      // Handle different types of errors
      let errorMessage = error.message || 'เกิดข้อผิดพลาดในการลบรายวิชา';
      if (onError) {
        onError(errorMessage);
      }

    } finally {
      // Always close the dialog regardless of success or failure
      handleDeleteDialogClose();
    }
  };

  // Handle detail dialog
  const handleDetailDialogClose = () => {
    setOpenDetailDialog(false);
    setCourseDetail(null);
  };


  // Format date display with day of week
  const formatDateWithDay = (date: string): string => {
    const dayjs_date = dayjs(date);
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const dayName = dayNames[dayjs_date.day()];
    return `วัน${dayName}ที่ ${dayjs_date.format('DD/MM/YYYY')}`;
  };

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1200px' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ paddingLeft: '48px' }}>รหัสวิชา</TableCell>
              <TableCell>ชื่อวิชา</TableCell>
              <TableCell>ปีการศึกษา</TableCell>
              <TableCell>ภาคเรียน</TableCell>
              <TableCell>วันเเละเวลาที่มีการเรียนการสอน</TableCell>
              <TableCell>ห้องเรียน</TableCell>
              <TableCell align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow
                  hover
                  key={row.courseId}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell sx={{ paddingLeft: '48px' }}>
                    <Typography variant="body2" fontWeight={600}>
                      {row.courseCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {row.courseName}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.academicYear}</TableCell>
                  <TableCell>{row.semester}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getDayLabel(row.dayOfWeek)} {formatTime(row.startTime)} - {formatTime(row.endTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.room}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(Number(row.courseId)); // Changed from handleOpenEditDialog
                        }}
                        title="แก้ไข"
                      >
                        <img
                          src="/assets/edit.png"
                          alt="Edit"
                          style={{ width: 20, height: 20 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDialogOpen(row);
                        }}
                        title="ลบ"
                      >
                        <img
                          src="/assets/delete.png"
                          alt="Delete"
                          style={{ width: 20, height: 20 }}
                        />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />

      {/* Course Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={handleDetailDialogClose} fullWidth maxWidth="md">
        <DialogTitle>รายละเอียดรายวิชา</DialogTitle>
        <DialogContent>
          {courseDetail && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {courseDetail.courseCode}: {courseDetail.courseName}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Chip label={`ปีการศึกษา ${courseDetail.academicYear}`} />
                  <Chip label={`ภาคเรียนที่ ${courseDetail.semester}`} />
                  <Chip label={getDayLabel(courseDetail.dayOfWeek)} />
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>ตารางเรียน</Typography>
                <Typography variant="body2">
                  วัน{getDayLabel(courseDetail.dayOfWeek)} เวลา {formatTime(courseDetail.startTime)} - {formatTime(courseDetail.endTime)} ห้อง {courseDetail.room}
                </Typography>
                <Typography variant="body2">
                  ระยะเวลา: {formatDate(courseDetail.startDate)} - {formatDate(courseDetail.endDate)}
                </Typography>
              </Box>

              {courseDetail.lecturers.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>อาจารย์ผู้สอน</Typography>
                  {courseDetail.lecturers.map((lecturer, index) => (
                    <Typography key={index} variant="body2">
                      • {lecturer.lecturerNameTh} ({lecturer.lecturerNameEn})
                    </Typography>
                  ))}
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  ตารางสอน ({courseDetail.schedules.length} ครั้ง)
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {courseDetail.schedules.map((schedule, index) => (
                    <Box key={schedule.courseScheduleId} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ครั้งที่ {index + 1} : {formatDateWithDay(schedule.scheduleDate)}
                        {' '}{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        {' '}ห้อง {schedule.room}
                        {schedule.remark && <em> ({schedule.remark})</em>}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  นักเรียนที่ลงทะเบียน ({courseDetail.enrollments.length} คน)
                </Typography>
                {courseDetail.enrollments.length > 0 ? (
                  <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                    {courseDetail.enrollments.map((enrollment) => (
                      <Typography key={enrollment.enrollmentId} variant="body2">
                        • {enrollment.studentNameTh} ({enrollment.studentNo}) - {enrollment.status}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มีนักเรียนลงทะเบียน
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: 'error.main' }}>
          ⚠️ ยืนยันการลบรายวิชา
        </DialogTitle>
        <DialogContent>
          {courseToDelete && (
            <Stack spacing={2}>
              <Typography>
                คุณต้องการลบรายวิชา <strong>{courseToDelete.courseCode}: {courseToDelete.courseName}</strong> ใช่หรือไม่?
              </Typography>

              {/* Show course details */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>รายละเอียดรายวิชา:</strong>
                </Typography>
                <Typography variant="body2">
                  • ปีการศึกษา: {courseToDelete.academicYear} ภาคเรียนที่ {courseToDelete.semester}
                </Typography>
                <Typography variant="body2">
                  • ตารางเรียน: วัน{getDayLabel(courseToDelete.dayOfWeek)} {formatTime(courseToDelete.startTime)} - {formatTime(courseToDelete.endTime)}
                </Typography>
                <Typography variant="body2">
                  • ห้องเรียน: {courseToDelete.room}
                </Typography>
                <Typography variant="body2">
                  • จำนวนตารางสอน: {courseToDelete.schedules.length} ครั้ง
                </Typography>
                <Typography variant="body2">
                  • จำนวนนักเรียนที่ลงทะเบียน: {courseToDelete.enrollments.length} คน
                </Typography>
                {courseToDelete.lecturers.length > 0 && (
                  <Typography variant="body2">
                    • อาจารย์ผู้สอน: {courseToDelete.lecturers.map(l => l.lecturerNameTh).join(', ')}
                  </Typography>
                )}
              </Box>

              {/* Warning message */}
              <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                <Typography variant="body2" color="error.main" gutterBottom>
                  <strong>คำเตือน:</strong>
                </Typography>
                <Typography variant="body2" color="error.main">
                  • การลบรายวิชานี้จะลบข้อมูลตารางเรียนทั้งหมด
                </Typography>
                {courseToDelete.enrollments.length > 0 && (
                  <Typography variant="body2" color="error.main">
                    • การลงทะเบียนของนักเรียน {courseToDelete.enrollments.length} คนจะถูกลบ
                  </Typography>
                )}
                <Typography variant="body2" color="error.main">
                  • การดำเนินการนี้ไม่สามารถยกเลิกได้
                </Typography>
              </Box>

              {/* Additional confirmation for courses with enrollments */}
              {courseToDelete.enrollments.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                  <Typography variant="body2" color="warning.main">
                    <strong>หมายเหตุ:</strong> รายวิชานี้มีนักเรียนลงทะเบียนอยู่ {courseToDelete.enrollments.length} คน
                    การลบจะส่งผลกระทบต่อนักเรียนเหล่านั้น
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleDeleteDialogClose} variant="outlined">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            startIcon={
              <img
                src="/assets/delete.png"
                alt="Delete"
                style={{ width: 16, height: 16, filter: 'brightness(0) invert(1)' }}
              />
            }
          >
            ลบรายวิชา
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
