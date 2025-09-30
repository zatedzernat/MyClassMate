'use client';

import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
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
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { CourseResponse, DayOfWeek } from '@/api/data/course-response';
import { useRouter } from 'next/navigation';

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
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const router = useRouter();

  // Calculate selectedAll and selectedSome
  const selectedAll = rows.length > 0 && selected.size === rows.length;
  const selectedSome = selected.size > 0 && selected.size < rows.length;

  const selectOne = (id: number) => {
    setSelected((prev) => new Set(prev).add(id));
  };

  const deselectOne = (id: number) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const selectAll = () => {
    setSelected(new Set(rows.map((row) => row.courseId)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

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

  // Handle edit dialog
  const handleOpenEditDialog = (course: CourseResponse) => {
    setSelectedCourse({ ...course });
    setOpenEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setSelectedCourse(null);
  };

  const handleSave = async () => {
    if (selectedCourse) {
      try {
        // TODO: Implement course update API
        console.log('Updated course:', selectedCourse);
        
        if (onUpdated) {
          onUpdated();
        }
      } catch (error: any) {
        const message = error?.message || "Something went wrong";
        if (onError) {
          onError(message);
        }
      }
    }
    handleEditDialogClose();
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
    if (courseToDelete) {
      try {
        // TODO: Implement course delete API
        console.log('Deleted course:', courseToDelete);

        if (onUpdated) {
          onUpdated();
        }
      } catch (error: any) {
        const message = error?.message || "Something went wrong";
        if (onError) {
          onError(message);
        }
      }
    }
    handleDeleteDialogClose();
  };

  // Handle detail dialog
  const handleDetailDialogClose = () => {
    setOpenDetailDialog(false);
    setCourseDetail(null);
  };

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1200px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
              </TableCell>
              <TableCell>รหัสวิชา</TableCell>
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
              const isSelected = selected.has(row.courseId);
              const lecturerNames = row.lecturers.map(l => l.lecturerNameTh).join(', ');
              const enrollmentCount = row.enrollments.length;
              const activeEnrollments = row.enrollments.filter(e => e.status === 'ACTIVE').length;

              return (
                <TableRow
                  hover
                  key={row.courseId}
                  selected={isSelected}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(row)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        event.stopPropagation();
                        if (event.target.checked) {
                          selectOne(row.courseId);
                        } else {
                          deselectOne(row.courseId);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
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
                          handleOpenEditDialog(row);
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
                        ครั้งที่ {index + 1}: {formatDate(schedule.scheduleDate)} 
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
        <DialogActions>
          <Button onClick={handleDetailDialogClose}>ปิด</Button>
          <Button variant="contained" onClick={() => {
            handleDetailDialogClose();
            if (courseDetail) handleOpenEditDialog(courseDetail);
          }}>
            แก้ไข
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditDialogClose} fullWidth maxWidth="md">
        <DialogTitle>แก้ไขรายวิชา</DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="รหัสวิชา"
                value={selectedCourse.courseCode}
                onChange={(e) =>
                  setSelectedCourse(prev => prev ? { ...prev, courseCode: e.target.value } : null)
                }
                fullWidth
              />
              <TextField
                label="ชื่อวิชา"
                value={selectedCourse.courseName}
                onChange={(e) =>
                  setSelectedCourse(prev => prev ? { ...prev, courseName: e.target.value } : null)
                }
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>ปีการศึกษา</InputLabel>
                  <Select 
                    value={selectedCourse.academicYear} 
                    label="ปีการศึกษา"
                    onChange={(e) =>
                      setSelectedCourse(prev => prev ? { ...prev, academicYear: Number(e.target.value) } : null)
                    }
                  >
                    <MenuItem value={2567}>2567</MenuItem>
                    <MenuItem value={2568}>2568</MenuItem>
                    <MenuItem value={2569}>2569</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>ภาคเรียน</InputLabel>
                  <Select 
                    value={selectedCourse.semester} 
                    label="ภาคเรียน"
                    onChange={(e) =>
                      setSelectedCourse(prev => prev ? { ...prev, semester: Number(e.target.value) } : null)
                    }
                  >
                    <MenuItem value={1}>ภาคเรียนที่ 1</MenuItem>
                    <MenuItem value={2}>ภาคเรียนที่ 2</MenuItem>
                    <MenuItem value={3}>ภาคเรียนที่ 3</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField 
                  label="ห้องเรียน" 
                  value={selectedCourse.room}
                  onChange={(e) =>
                    setSelectedCourse(prev => prev ? { ...prev, room: e.target.value } : null)
                  }
                  fullWidth 
                />
                <FormControl fullWidth>
                  <InputLabel>วันในสัปดาห์</InputLabel>
                  <Select 
                    value={selectedCourse.dayOfWeek} 
                    label="วันในสัปดาห์"
                    onChange={(e) =>
                      setSelectedCourse(prev => prev ? { ...prev, dayOfWeek: e.target.value as DayOfWeek } : null)
                    }
                  >
                    {Object.values(DayOfWeek).map((day) => (
                      <MenuItem key={day} value={day}>
                        วัน{getDayLabel(day)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="เวลาเริ่ม"
                  type="time"
                  value={selectedCourse.startTime}
                  onChange={(e) =>
                    setSelectedCourse(prev => prev ? { ...prev, startTime: e.target.value } : null)
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="เวลาสิ้นสุด"
                  type="time"
                  value={selectedCourse.endTime}
                  onChange={(e) =>
                    setSelectedCourse(prev => prev ? { ...prev, endTime: e.target.value } : null)
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="วันที่เริ่มเรียน"
                  type="date"
                  value={selectedCourse.startDate}
                  onChange={(e) =>
                    setSelectedCourse(prev => prev ? { ...prev, startDate: e.target.value } : null)
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="วันที่เรียนจบ"
                  type="date"
                  value={selectedCourse.endDate}
                  onChange={(e) =>
                    setSelectedCourse(prev => prev ? { ...prev, endDate: e.target.value } : null)
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose} fullWidth maxWidth="xs">
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบรายวิชา <strong>{courseToDelete?.courseCode}: {courseToDelete?.courseName}</strong> ใช่หรือไม่?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            การลบรายวิชานี้จะลบข้อมูลตารางเรียนและการลงทะเบียนของนักเรียนทั้งหมด
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>ยกเลิก</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}