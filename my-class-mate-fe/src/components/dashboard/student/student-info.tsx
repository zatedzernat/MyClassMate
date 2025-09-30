import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { StudentResponse, UpdateStudentRequest } from '@/api/data/student-response';
import { updateStudentProfile } from '@/api/student-api';
import ErrorDialog from '@/components/error/error-dialog';
import { error } from 'console';

interface StudentInfoProps {
  studentData: StudentResponse | null;
  onDataUpdate: () => Promise<void>; // Callback for data refresh
}

export function StudentInfo({
  studentData,
  onDataUpdate
}: StudentInfoProps): React.JSX.Element {
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);

  // Form data state
  const [formData, setFormData] = React.useState<UpdateStudentRequest>({
    studentId: '',
    address: '',
    phoneNumber: '',
    remark: ''
  });

  // Initialize form data when dialog opens
  const handleOpenEditDialog = () => {
    if (studentData) {
      setFormData({
        studentId: studentData.studentId,
        address: studentData.address || '',
        phoneNumber: studentData.phoneNumber || '',
        remark: studentData.remark || ''
      });
    }
    setUpdateError(null);
    setUpdateSuccess(false);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setUpdateError(null);
    setUpdateSuccess(false);
    setIsUpdating(false);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof UpdateStudentRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  // Handle form submission
  const handleSubmitUpdateData = async () => {
    if (!studentData?.studentId) {
        throw new Error('Student ID is required for updating profile.');
      }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateStudentProfile(studentData?.studentId, formData);

      setUpdateSuccess(true);
      handleCloseEditDialog();

      // Refresh data after successful update
      await onDataUpdate();


    } catch (error: any) {
      setUpdateError(error?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state if studentData is null
  if (!studentData) {
    return (
      <Card sx={{ minHeight: 120 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading student information...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ minHeight: 120 }}>
        <CardContent sx={{ minHeight: 80, p: { xs: 2, sm: 3 } }}>
          {/* Compact Horizontal Layout */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
              textAlign: { xs: 'center', sm: 'left' },
              width: '100%',
            }}
          >
            {/* Student Details Section */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={1}>
                {/* Name */}
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    fontWeight: 600,
                    lineHeight: 1.2
                  }}
                >
                  {studentData.studentNameTh}
                </Typography>

                {/* English Name (if available) */}
                {studentData.studentNameEn && (
                  <Typography
                    color="text.secondary"
                    variant="body1"
                    sx={{
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      fontWeight: 400
                    }}
                  >
                    {studentData.studentNameEn}
                  </Typography>
                )}

                {/* Student Number */}
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: { xs: 1, sm: 2 },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography
                    color="primary.main"
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '0.9rem' }
                    }}
                  >
                    รหัสนักศึกษา: {studentData.studentNo}
                  </Typography>
                </Box>

                {/* Contact Information */}
                {studentData.address && (
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '0.9rem' }
                        }}
                      >
                        📍 {studentData.address}
                      </Typography>
                )}

                {studentData.phoneNumber && (
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.875rem', sm: '0.9rem' }
                        }}
                      >
                        📞 {studentData.phoneNumber}
                      </Typography>
                )}

                {/* Remark */}
                {studentData.remark && (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '0.9rem' },
                      fontStyle: 'italic'
                    }}
                  >
                    💬 {studentData.remark}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'column' },
              gap: 1,
              alignItems: 'center'
            }}>
              <Button
                variant="outlined"
                onClick={handleOpenEditDialog}
                size="medium"
                sx={{ minWidth: 120 }}
              >
                ✏️ แก้ไขข้อมูล
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 2 }}>
          ✏️ แก้ไขข้อมูลนักศึกษา
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={3}>
            {/* Address */}
            <TextField
              label="ที่อยู่"
              value={formData.address}
              onChange={handleInputChange('address')}
              disabled={isUpdating}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="medium"
              placeholder="กรุณากรอกที่อยู่ของนักศึกษา"
              sx={{ marginTop: '8px' }}
            />

            {/* Phone Number */}
            <TextField
              label="หมายเลขโทรศัพท์"
              value={formData.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              disabled={isUpdating}
              fullWidth
              variant="outlined"
              size="medium"
              placeholder="เช่น 081-234-5678"
              inputProps={{
                maxLength: 15
              }}
            />

            {/* Remark */}
            <TextField
              label="หมายเหตุ"
              value={formData.remark}
              onChange={handleInputChange('remark')}
              disabled={isUpdating}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              size="medium"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={handleCloseEditDialog}
            disabled={isUpdating}
            color="inherit"
            size="large"
          >
            ยกเลิก
          </Button>

          <Button
            onClick={handleSubmitUpdateData}
            disabled={isUpdating || updateSuccess}
            variant="contained"
            size="large"
            startIcon={isUpdating ? <CircularProgress size={16} /> : null}
            sx={{ minWidth: 120 }}
          >
            {isUpdating ? 'กำลังอัปเดต...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
      <ErrorDialog
        open={Boolean(updateError)}
        message={updateError || ''}
        onClose={handleCloseEditDialog}
      />
    </>
  );
}