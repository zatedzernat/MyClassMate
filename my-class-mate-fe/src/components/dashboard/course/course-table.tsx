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
import { Role } from '@/util/role-enum';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';

function noop(): void {
  // do nothing
}

export interface CoursesTableProps {
  count?: number;
  page?: number;
  rows?: CourseResponse[];
  rowsPerPage?: number;
  onUpdated?: () => void;
  onError?: (message: string) => void;
  onShowToast?: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  userRole?: string | null;
}

export function CoursesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onUpdated: onUpdated,
  onError: onError,
  onShowToast: onShowToast = noop,
  userRole
}: CoursesTableProps): React.JSX.Element {
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
    const dayjs_date = dayjs(date);
    const buddhistYear = dayjs_date.year() + 543;
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ตค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiMonth = thaiMonths[dayjs_date.month()];
    return `${dayjs_date.date()} ${thaiMonth} ${buddhistYear}`;
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
        onShowToast(`ลบรายวิชา ${courseToDelete.courseCode} เรียบร้อยแล้ว`, 'success');
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

  const handleAddStudent = (course: CourseResponse) => {
    const courseParams = new URLSearchParams({
      courseId: course.courseId.toString(),
      courseName: `${course.courseCode}: ${course.courseName}`
    });
    router.push(`${paths.dashboard.course}/add-student-to-course?${courseParams}`);
  };

  const handleViewReport = (course: CourseResponse) => {
    const courseParams = new URLSearchParams({
      courseId: course.courseId.toString(),
      courseName: `${course.courseCode}: ${course.courseName}`
    });
    router.push(`${paths.dashboard.course}/course-report?${courseParams}`);
  };


  // Format date display with day of week
  const formatDateWithDay = (date: string): string => {
    const dayjs_date = dayjs(date);
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const dayName = dayNames[dayjs_date.day()];
    const buddhistYear = dayjs_date.year() + 543;
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ตค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiMonth = thaiMonths[dayjs_date.month()];
    return `วัน${dayName}ที่ ${dayjs_date.date()} ${thaiMonth} ${buddhistYear}`;
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
              <TableCell align="center">การดำเนินการ</TableCell>
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
                      {getDayLabel(row.dayOfWeek)} {formatTime(row.startTime)} - {formatTime(row.endTime)} น.
                    </Typography>
                  </TableCell>
                  <TableCell>{row.room}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {/* Management buttons - only for non-students */}
                      {userRole !== Role.STUDENT && (
                        <>
                          <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(row);
                          }}
                          title="ดูรายงาน"
                          >
                            <ChartBar size={20} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddStudent(row);
                              console.log('Add student to course:', row.courseId);
                            }}
                            title="เพิ่มผู้เรียน"
                          >
                            <img
                              src="/assets/add-user.png"
                              alt="Add Student"
                              style={{ width: 20, height: 20 }}
                            />
                          </IconButton>
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
                        </>
                      )}
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
                  วัน{getDayLabel(courseDetail.dayOfWeek)} เวลา {formatTime(courseDetail.startTime)} - {formatTime(courseDetail.endTime)} น. ห้อง {courseDetail.room} ตั้งแต่ {formatDate(courseDetail.startDate)} - {formatDate(courseDetail.endDate)}
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
                  ตารางเรียน ({courseDetail.schedules.length} ครั้ง)
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {courseDetail.schedules.map((schedule, index) => (
                    <Box key={schedule.courseScheduleId} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ครั้งที่ {index + 1} : {formatDateWithDay(schedule.scheduleDate)}
                        {' '}{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)} น.
                        {' '}ห้อง {schedule.room}
                        {schedule.remark && <em> ({schedule.remark})</em>}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  ผู้เรียนที่ลงทะเบียน ({courseDetail.enrollments.length} คน)
                </Typography>
                {courseDetail.enrollments.length > 0 ? (
                  <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                    {courseDetail.enrollments.map((enrollment, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{ mb: 0.5 }}
                      >
                        {index + 1}. <span style={{ color: '#1976d2', fontSize: '0.875rem' }}>{enrollment.studentNo}</span> {enrollment.studentNameTh}
                        {enrollment.studentNameEn && (
                          <span style={{ color: '#666', marginLeft: '8px' }}>
                            ({enrollment.studentNameEn})
                          </span>
                        )}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มีผู้เรียนลงทะเบียน
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
                  • ตารางเรียน: วัน{getDayLabel(courseToDelete.dayOfWeek)} {formatTime(courseToDelete.startTime)} - {formatTime(courseToDelete.endTime)} น.
                </Typography>
                <Typography variant="body2">
                  • ห้องเรียน: {courseToDelete.room}
                </Typography>
                <Typography variant="body2">
                  • จำนวนตารางเรียน: {courseToDelete.schedules.length} ครั้ง
                </Typography>
                <Typography variant="body2">
                  • จำนวนผู้เรียนที่ลงทะเบียน: {courseToDelete.enrollments.length} คน
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
                    • การลงทะเบียนของผู้เรียน {courseToDelete.enrollments.length} คนจะถูกลบ
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
                    <strong>หมายเหตุ:</strong> รายวิชานี้มีผู้เรียนลงทะเบียนอยู่ {courseToDelete.enrollments.length} คน
                    การลบจะส่งผลกระทบต่อผู้เรียนเหล่านั้น
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
