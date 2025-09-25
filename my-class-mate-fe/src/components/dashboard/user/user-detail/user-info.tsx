import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { UserResponse } from '@/api/data/user-response';
import { getRoleLabel } from '@/util/role-enum';

interface UsersInfoProps {
  user: UserResponse | null;
  onToggleDetailsForm: () => void; // Function to toggle form visibility
  showDetailsForm: boolean; // Current state of form visibility
}

export function UserInfo({ 
  user, 
  onToggleDetailsForm, 
  showDetailsForm 
}: UsersInfoProps): React.JSX.Element {
  // Show loading state if user is null
  if (!user) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography>Loading user information...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar 
              src={'/assets/default-avatar.png'} 
              sx={{ height: '80px', width: '80px' }}
            >
            </Avatar>
          </div>
          
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">
              {user.nameTh} {user.surnameTh}
            </Typography>
            {user.nameEn && user.surnameEn && (
              <Typography color="text.secondary" variant="body2">
                {user.nameEn} {user.surnameEn}
              </Typography>
            )}
            <Typography color="text.secondary" variant="body2">
              {user.username}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {getRoleLabel(user.role)}
            </Typography>
            {user.studentProfile?.studentNo && (
              <Typography color="text.secondary" variant="body2">
                รหัสนักศึกษา: {user.studentProfile.studentNo}
              </Typography>
            )}
            <Typography color="text.secondary" variant="body2">
              {user.email}
            </Typography>
            <Typography 
              color={user.imageCount === 4 ? "success.main" : "warning.main"} 
              variant="body2"
            >
              อัปโหลดภาพถ่ายใบหน้าแล้วจำนวน {user.imageCount || 0} รูป
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}