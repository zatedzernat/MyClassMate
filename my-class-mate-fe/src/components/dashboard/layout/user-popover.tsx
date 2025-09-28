import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';

import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';
import { getRoleLabel } from '@/util/role-enum';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { checkSession } = useUser();
  const router = useRouter();

  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<{
    username: string;
    fullName: string;
    email: string;
    role: string;
  } | null>(null);

  // Load user data from localStorage
  React.useEffect(() => {
    const username = localStorage.getItem('user-name') || 'user';
    const fullName = localStorage.getItem('user-fullname') || 'ชื่อ สกุล';
    const email = localStorage.getItem('user-email') || 'user@example.com';
    const role = localStorage.getItem('user-role') || 'USER';

    setUserData({
      username,
      fullName,
      email,
      role,
    });
  }, [open]); // Reload when popover opens

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error('Sign out error', error);
        return;
      }

      // Clear localStorage
      localStorage.removeItem('user-id');
      localStorage.removeItem('user-name');
      localStorage.removeItem('user-fullname');
      localStorage.removeItem('user-email');
      localStorage.removeItem('user-role');
      
      await checkSession?.();
      router.refresh();
    } catch (error) {
      logger.error('Sign out error', error);
    }
  }, [checkSession, router]);

  return (
    <>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        onClose={onClose}
        open={open}
        slotProps={{ paper: { sx: { width: '280px' } } }}
      >
        <Box sx={{ p: '16px 20px' }}>
          <Stack spacing={2} alignItems="center">
            {/* User Info */}
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {userData?.fullName || 'ผู้ใช้'}
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                @{userData?.username || 'user'}
              </Typography>
              <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mb: 1 }}>
                {userData?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Divider />
        
        <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
          <MenuItem
            onClick={() => {
              setLogoutDialogOpen(true);
              onClose(); // close the popover first
            }}
            sx={{ 
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.dark'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <SignOutIcon fontSize="var(--icon-fontSize-md)" />
            </ListItemIcon>
            ออกจากระบบ
          </MenuItem>
        </MenuList>
      </Popover>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>ยืนยันการออกจากระบบ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการออกจากระบบหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
            ยกเลิก
          </Button>
          <Button
            onClick={() => {
              handleSignOut();
              setLogoutDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            ออกจากระบบ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}