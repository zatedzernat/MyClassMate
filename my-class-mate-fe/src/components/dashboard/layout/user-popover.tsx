import * as React from 'react';
import RouterLink from 'next/link';
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

import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { checkSession } = useUser();
  const router = useRouter();

  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error('Sign out error', error);
        return;
      }

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
        slotProps={{ paper: { sx: { width: '240px' } } }}
      >
        <Box sx={{ p: '16px 20px ' }}>
          <Typography variant="subtitle1">Sofia Rivers</Typography>
          <Typography color="text.secondary" variant="body2">
            sofia.rivers@devias.io
          </Typography>
        </Box>
        <Divider />
        <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
          <MenuItem component={RouterLink} href={paths.dashboard.settings} onClick={onClose}>
            <ListItemIcon>
              <GearSixIcon fontSize="var(--icon-fontSize-md)" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem component={RouterLink} href={paths.dashboard.account} onClick={onClose}>
            <ListItemIcon>
              <UserIcon fontSize="var(--icon-fontSize-md)" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              setLogoutDialogOpen(true);
              onClose(); // close the popover first
            }}
          >
            <ListItemIcon>
              <SignOutIcon fontSize="var(--icon-fontSize-md)" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </MenuList>
      </Popover>

      {/* 🔹 Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>{"ยืนยันการออกจากระบบ"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
          ท่านต้องการออกจากระบบหรือไม่?
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
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
