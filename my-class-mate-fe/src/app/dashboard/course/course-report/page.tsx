'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCourseReport, exportCourseReport } from '@/api/report-api';
import { 
  CourseReportResponse, 
  CourseScheduleReportResponse,
  AttendanceReportResponse,
  ParticipationReportResponse
} from '@/api/data/report-response';
import { CheckInStatus, getCheckInStatusLabel } from '@/util/check-in-status';

export default function CourseReportPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const courseName = searchParams.get('courseName');

  const [reportData, setReportData] = React.useState<CourseReportResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchReportData = async () => {
      if (!courseId) {
        setError('ไม่พบรหัสรายวิชา');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getCourseReport(Number.parseInt(courseId, 10));
        setReportData(data);
        
        // Set the default schedule index after data is loaded
        if (data && data.schedules && data.schedules.length > 0) {
          const defaultIndex = findDefaultScheduleIndex(data.schedules);
          setSelectedScheduleIndex(defaultIndex);
        }
        
        setError(null);
      } catch (error_: unknown) {
        console.error('Error fetching report data:', error_);
        const errorMessage = error_ instanceof Error ? error_.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [courseId]);

  const handleExport = async () => {
    if (!courseId) return;

    try {
      setExporting(true);
      await exportCourseReport(Number.parseInt(courseId, 10));
    } catch (error_: unknown) {
      console.error('Error exporting report:', error_);
      const errorMessage = error_ instanceof Error ? error_.message : 'เกิดข้อผิดพลาดในการส่งออกรายงาน';
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Find the default schedule to show (today's schedule or latest past schedule)
  const findDefaultScheduleIndex = (schedules: CourseScheduleReportResponse[]): number => {
    if (!schedules || schedules.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // First, try to find today's schedule
    const todayIndex = schedules.findIndex(schedule => {
      const scheduleDate = new Date(schedule.scheduleDate).toISOString().split('T')[0];
      return scheduleDate === todayStr;
    });

    if (todayIndex !== -1) {
      return todayIndex;
    }

    // If no schedule for today, find the latest past schedule
    let latestPastIndex = -1;
    let latestPastDate: Date | null = null;

    for (const [i, schedule] of schedules.entries()) {
      const scheduleDate = new Date(schedule.scheduleDate);
      if (scheduleDate < today) {
        if (!latestPastDate || scheduleDate > latestPastDate) {
          latestPastDate = scheduleDate;
          latestPastIndex = i;
        }
      }
    }

    // Return latest past schedule index, or 0 if no past schedules found
    return latestPastIndex === -1 ? 0 : latestPastIndex;
  };

  const getStatusChip = (status: string) => {
    const statusEnum = status as CheckInStatus;
    const label = getCheckInStatusLabel(statusEnum);
    
    let color: 'success' | 'warning' | 'error' = 'success';
    if (status === CheckInStatus.LATE) color = 'warning';
    if (status === CheckInStatus.ABSENT) color = 'error';

    return (
      <Chip
        label={label}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Typography>กำลังโหลดข้อมูลรายงาน...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Stack spacing={2}>
            <IconButton onClick={handleBack} size="small" sx={{ alignSelf: 'flex-start' }}>
              <ArrowLeftIcon size={20} />
            </IconButton>
            <Typography color="error">{error}</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (!reportData) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Stack spacing={2}>
            <IconButton onClick={handleBack} size="small" sx={{ alignSelf: 'flex-start' }}>
              <ArrowLeftIcon size={20} />
            </IconButton>
            <Typography>ไม่พบข้อมูลรายงาน</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={handleBack} size="small">
                <ArrowLeftIcon size={20} />
              </IconButton>
              <Typography variant="h4" component="h1">
                รายงานรายวิชา
              </Typography>
            </Stack>
            <Button
              color="inherit"
              startIcon={
                exporting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon fontSize="var(--icon-fontSize-md)" />
                )
              }
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'กำลังส่งออก...' : 'Export'}
            </Button>
          </Stack>

          {/* Course Information */}
          <Card>
            <CardHeader
              title="ข้อมูลรายวิชา"
              sx={{ pb: 1 }}
            />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ชื่อรายวิชา
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {courseName || `รายวิชา ${reportData.courseId}`}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      จำนวนตารางเรียนทั้งหมด
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {reportData.schedules.length} ครั้ง
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Course Schedules */}
          <Card>
            <CardHeader
              title="รายงานการเช็คชื่อเข้าเรียนและการเข้าร่วม"
              sx={{ pb: 1 }}
            />
            <CardContent>
              <Stack spacing={3}>
                {/* Schedule Selector */}
                {reportData.schedules.length > 1 && (
                  <FormControl fullWidth size="small">
                    <InputLabel>ครั้งที่</InputLabel>
                    <Select
                      value={selectedScheduleIndex}
                      label="ครั้งที่"
                      onChange={(e) => setSelectedScheduleIndex(Number(e.target.value))}
                    >
                      {reportData.schedules.map((schedule: CourseScheduleReportResponse, index: number) => {
                        const buddhistDate = new Date(schedule.scheduleDate).toLocaleDateString('th-TH-u-ca-buddhist', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                        return (
                          <MenuItem key={schedule.courseScheduleId} value={index}>
                            ครั้งที่ {index + 1} - {buddhistDate} ({schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)} น.)
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                )}

                {/* Selected Schedule Display */}
                {reportData.schedules[selectedScheduleIndex] && (
                  <Box>
                    {/* Schedule Info */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="subtitle1" fontWeight="medium">
                          ครั้งที่ {selectedScheduleIndex + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(reportData.schedules[selectedScheduleIndex].scheduleDate).toLocaleDateString('th-TH-u-ca-buddhist', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reportData.schedules[selectedScheduleIndex].startTime.slice(0, 5)} - {reportData.schedules[selectedScheduleIndex].endTime.slice(0, 5)} น.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ห้อง {reportData.schedules[selectedScheduleIndex].room}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack spacing={3}>
                      {/* Attendance Table */}
                      {reportData.schedules[selectedScheduleIndex].attendances && 
                       reportData.schedules[selectedScheduleIndex].attendances!.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            การเข้าเรียน
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>รหัสนักเรียน</TableCell>
                                  <TableCell>ชื่อ-นามสกุล (ภาษาไทย)</TableCell>
                                  <TableCell>ชื่อ-นามสกุล (ภาษาอังกฤษ)</TableCell>
                                  <TableCell align="center">สถานะการเข้าเรียน</TableCell>
                                  <TableCell align="center">เวลาเข้าเรียน</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reportData.schedules[selectedScheduleIndex].attendances!.map((attendance: AttendanceReportResponse, attendanceIndex: number) => (
                                  <TableRow key={attendanceIndex}>
                                    <TableCell>{attendance.studentNo}</TableCell>
                                    <TableCell>{attendance.studentNameTh}</TableCell>
                                    <TableCell>{attendance.studentNameEn}</TableCell>
                                    <TableCell align="center">
                                      {getStatusChip(attendance.status)}
                                    </TableCell>
                                    <TableCell align="center">
                                      {attendance.attendedAt 
                                          ? `${new Date(attendance.attendedAt).toLocaleTimeString('th-TH', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                          })} น.`
                                          : '-'
                                      }
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Participation Table */}
                      {reportData.schedules[selectedScheduleIndex].participations && 
                       reportData.schedules[selectedScheduleIndex].participations!.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            การมีส่วนร่วม
                          </Typography>
                          <Stack spacing={2}>
                            {reportData.schedules[selectedScheduleIndex].participations!.map((participation: ParticipationReportResponse, participationIndex: number) => (
                              <Box key={participationIndex}>
                                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                                  รอบที่ {participation.round}: {participation.topic}
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>รหัสนักเรียน</TableCell>
                                        <TableCell>ชื่อ (ภาษาไทย)</TableCell>
                                        <TableCell>ชื่อ (ภาษาอังกฤษ)</TableCell>
                                        <TableCell align="center">สถานะการให้คะแนน</TableCell>
                                        <TableCell align="center">คะแนน</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {participation.requestParticipations.map((request, requestIndex: number) => (
                                        <TableRow key={requestIndex}>
                                          <TableCell>{request.studentNo}</TableCell>
                                          <TableCell>{request.studentNameTh}</TableCell>
                                          <TableCell>{request.studentNameEn}</TableCell>
                                          <TableCell align="center">
                                            <Chip
                                              label={request.isScored ? 'ให้คะแนนแล้ว' : 'ยังไม่ให้คะแนน'}
                                              color={request.isScored ? 'success' : 'default'}
                                              size="small"
                                              variant="outlined"
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            {request.isScored ? request.score : '-'}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* No data message */}
                      {(!reportData.schedules[selectedScheduleIndex].attendances || 
                        reportData.schedules[selectedScheduleIndex].attendances!.length === 0) &&
                       (!reportData.schedules[selectedScheduleIndex].participations || 
                        reportData.schedules[selectedScheduleIndex].participations!.length === 0) && (
                        <Typography variant="body2" color="text.secondary" align="center">
                          ยังไม่มีข้อมูลการเข้าเรียนหรือการมีส่วนร่วม
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
}