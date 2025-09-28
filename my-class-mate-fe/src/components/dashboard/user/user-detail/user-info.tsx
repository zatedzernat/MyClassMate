import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { UserResponse } from '@/api/data/user-response';
import { getRoleLabel, Role } from '@/util/role-enum';

interface UsersInfoProps {
  user: UserResponse | null;
  onToggleDetailsForm: () => void;
  showDetailsForm: boolean;
}

export function UserInfo({
  user,
  onToggleDetailsForm,
  showDetailsForm
}: UsersInfoProps): React.JSX.Element {
  // Show loading state if user is null
  if (!user) {
    return (
      <Card sx={{ minHeight: 120 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
          <Typography>Loading user information...</Typography>
        </CardContent>
      </Card>
    );
  }

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
                      รหัส: <strong>{user.studentProfile.studentNo}</strong>
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
            </Stack>
          </Box>

          {/* Enhanced Status Badge - Only show for STUDENT role */}
          {user.role === Role.STUDENT && (
            <Box sx={{ 
              flexShrink: 0,
              px: { xs: 2, sm: 3 },
              py: 1,
              borderRadius: 2,
              backgroundColor: user.isUploadedImage ? 'success.light' : 'error.light',
              color: user.isUploadedImage ? 'success.dark' : 'error.dark',
              textAlign: 'center',
              border: '1px solid',
              borderColor: user.isUploadedImage ? 'success.main' : 'error.main',
              minWidth: { xs: 100, sm: 120 },
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                {user.isUploadedImage ? (
                  <>✓ พร้อมใช้งาน</>
                ) : (
                  <>❌ ยังไม่พร้อม</>
                )}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.625rem', display: 'block', mt: 0.25 }}>
                {user.isUploadedImage ? 'สแกนใบหน้าได้' : 'ต้องอัปโหลดภาพ'}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}