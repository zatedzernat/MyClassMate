'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  IconButton
} from '@mui/material';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { CalendarIcon } from '@phosphor-icons/react/dist/ssr/Calendar';
import { getParticipationsByCourseScheduleId } from '@/api/participation-api';
import { ParticipationResponse } from '@/api/data/participation-response';
import ErrorDialog from '@/components/error/error-dialog';
import { paths } from '@/paths';

// Helper functions moved to outer scope
const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'OPEN': {
      return 'success';
    }
    case 'CLOSED':
    case 'CLOSE': {
      return 'error';
    }
    default: {
      return 'info';
    }
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'OPEN': {
      return 'เปิดอยู่';
    }
    case 'CLOSED':
    case 'CLOSE': {
      return 'ปิดแล้ว';
    }
    default: {
      return status;
    }
  }
};

const getCurrentDate = (): string => {
  const today = new Date();
  return today.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatThaiDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' น.';
};

export default function ParticipationDetailPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseScheduleId = searchParams.get('courseScheduleId') || '';

  const [participations, setParticipations] = useState<ParticipationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogMessage, setErrorDialogMessage] = useState<string>('');

  // Fetch participations
  const fetchParticipations = React.useCallback(async () => {
    if (!courseScheduleId) {
      setError('ไม่พบข้อมูล Course Schedule ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching participations for course schedule ID:', courseScheduleId);
      const response = await getParticipationsByCourseScheduleId(courseScheduleId);
      if (response.success) {
        setParticipations(response.data);
        console.log('Participations:', response.data);
      } else {
        setError(response.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการมีส่วนร่วม');
        setErrorDialogMessage(response.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการมีส่วนร่วม');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการมีส่วนร่วม';
      console.error('Error fetching participations:', error);
      setError(errorMessage);
      setErrorDialogMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [courseScheduleId]);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  // Handle back button
  const handleBack = () => {
    router.push(paths.dashboard.participation);
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogMessage('');
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header with Back Button */}
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <IconButton onClick={handleBack} size="small">
              <ArrowLeftIcon size={20} />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              ข้อมูลการมีส่วนร่วม
            </Typography>
          </Stack>

          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              color="inherit"
              href={paths.dashboard.participation}
              onClick={(e) => {
                e.preventDefault();
                handleBack();
              }}
              sx={{ cursor: 'pointer' }}
            >
              รายวิชาวันนี้
            </Link>
            <Typography color="text.primary">ข้อมูลการมีส่วนร่วม</Typography>
          </Breadcrumbs>

          <Typography variant="body1" color="text.secondary">
            วันที่: {getCurrentDate()}
          </Typography>
        </Box>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>กำลังโหลดข้อมูลการมีส่วนร่วม...</Typography>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Participations Table */}
        {!loading && !error && (
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CalendarIcon size={20} />
                  <Typography variant="h6">
                    รายการการมีส่วนร่วม
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  พบข้อมูลการมีส่วนร่วม {participations.length} รายการ
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 80 }}>
                        รอบที่
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                        หัวข้อ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 100 }}>
                        สถานะ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 150 }}>
                        สร้างเมื่อ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', minWidth: 150 }}>
                        ปิดเมื่อ
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            ไม่พบข้อมูลการมีส่วนร่วมสำหรับคาบเรียนนี้
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      participations.map((participation) => (
                        <TableRow key={participation.participationId} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {participation.round}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {participation.topic}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getStatusLabel(participation.status)}
                              color={getStatusColor(participation.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatThaiDateTime(participation.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {participation.closedAt 
                                ? formatThaiDateTime(participation.closedAt)
                                : '-'
                              }
                            </Typography>
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