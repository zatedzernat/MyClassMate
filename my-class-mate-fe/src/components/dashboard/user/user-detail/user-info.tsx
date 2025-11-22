import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { UserResponse } from '@/api/data/user-response';
import { getRoleLabel, Role } from '@/util/role-enum';

interface UsersInfoProps {
  user: UserResponse | null;
  onDataUpdate: () => Promise<void>; // Callback for data refresh
  isUploadImage: boolean; // Flag to show upload UI
  onToggleUploadImage: () => void; // Toggle upload UI function
}

export function UserInfo({
  user,
  onDataUpdate,
  isUploadImage,
  onToggleUploadImage
}: UsersInfoProps): React.JSX.Element {
  // Show loading state if user is null
  if (!user) {
    return (
      <Card sx={{ minHeight: 120 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading user information...</Typography>
        </CardContent>
      </Card>
    );
  }

  // Check if user has uploaded face images
  const hasUploadedImages = user?.isUploadedImage || false;
  const imageCount = user?.imageCount || 0;

  return (
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
          {/* User Details Section - Simplified */}
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
                {user.nameTh} {user.surnameTh}
              </Typography>

              {/* English Name (if available) */}
              {user.nameEn && user.surnameEn && (
                <Typography
                  color="text.secondary"
                  variant="body1"
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 400
                  }}
                >
                  {user.nameEn} {user.surnameEn}
                </Typography>
              )}

              {/* Horizontal info row - Compact */}
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 2 },
                justifyContent: { xs: 'center', sm: 'flex-start' },
                alignItems: 'center'
              }}>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.9rem' }
                  }}
                >
                  {user.username}
                </Typography>

                <Box sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'text.secondary',
                  display: { xs: 'none', sm: 'block' }
                }} />

                <Typography
                  color="primary.main"
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '0.9rem' }
                  }}
                >
                  {getRoleLabel(user.role)}
                </Typography>

                {user.studentProfile?.studentNo && (
                  <>
                    <Box sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: 'text.secondary',
                      display: { xs: 'none', sm: 'block' }
                    }} />
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '0.9rem' }
                      }}
                    >
                      รหัสผู้เรียน: <strong>{user.studentProfile.studentNo}</strong>
                    </Typography>
                  </>
                )}
              </Box>

              {/* Email */}
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9rem' }
                }}
              >
                {user.email}
              </Typography>

              {/* Face Registration Status for Students */}
              {user.role === Role.STUDENT && (
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  alignItems: 'center',
                  mt: 1
                }}>
                  <Chip
                    label={hasUploadedImages ? `ลงทะเบียนใบหน้าแล้ว` : 'ยังไม่ลงทะเบียนใบหน้า'}
                    color={hasUploadedImages ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
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
            {/* Upload Image Button - Only for Students */}
            {user.role === Role.STUDENT && (
              <Button
                variant={isUploadImage ? 'contained' : 'outlined'}
                onClick={onToggleUploadImage}
                size="medium"
                color='primary'
                sx={{ minWidth: 120 }}
              >
                {isUploadImage ? '📱 ซ่อนกล้อง' : '📷 ลงทะเบียนใบหน้า'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}