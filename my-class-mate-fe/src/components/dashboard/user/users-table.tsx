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
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import dayjs from 'dayjs';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { updateUser, deleteUser } from '@/api/user-api'; // Import the API function
import { getRoleLabel, Role } from '@/util/role-enum';
import { UserRequest, UserResponse } from '@/api/data/user-response';
import { useRouter } from 'next/navigation';
import { paths } from '@/paths'; // adjust path if needed



function noop(): void {
  // do nothing
}

interface UsersTableProps {
  count?: number;
  page?: number;
  rows?: UserResponse[];
  rowsPerPage?: number;
  onUpdated?: () => void;
  onError?: (message: string) => void;
}

export function UsersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onUpdated: onUpdated,
  onError: onError,
}: UsersTableProps): React.JSX.Element {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);

  // Email validation
  const [emailError, setEmailError] = useState<string>('');
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('กรุณากรอกอีเมล');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      return false;
    }
    setEmailError('');
    return true;
  };


  // Calculate selectedAll and selectedSome
  const selectedAll = rows.length > 0 && selected.size === rows.length;
  const selectedSome = selected.size > 0 && selected.size < rows.length;

  const router = useRouter();

  const handleOpenEditDialog = (user: UserResponse) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setEmailError(''); // Reset email error
  };

  const handleSave = async () => {
    if (selectedUser) {
      // Validate email before saving
      if (!validateEmail(selectedUser.email)) {
        return;
      }
      
      const userRequest: UserRequest = {
        userId: selectedUser.userId,
        username: selectedUser.username,
        nameTh: selectedUser.nameTh,
        surnameTh: selectedUser.surnameTh,
        nameEn: selectedUser.nameEn,
        surnameEn: selectedUser.surnameEn,
        email: selectedUser.email,
        role: selectedUser.role,
        studentNo: selectedUser.studentProfile?.studentNo || '',
      };

      if (selectedUser.password && selectedUser.password.trim() !== "") {
        userRequest.password = selectedUser.password;
      }

      try {
        await updateUser(userRequest); // Call the updateUser API with the mapped request
        console.log('User updated successfully:', userRequest);

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
    console.log('Updated user:', selectedUser);
    handleEditDialogClose();
  };

  const handleDeleteDialogOpen = (user: UserResponse) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      const userRequest: UserRequest = {
        userId: userToDelete.userId,
        username: userToDelete.username,
        password: '',
        nameTh: '',
        surnameTh: '',
        nameEn: '',
        surnameEn: '',
        email: '',
        role: Role.NOTHING,
      };

      try {
        await deleteUser(userRequest); // Call the updateUser API with the mapped request
        console.log('User deleted successfully:', userRequest);

        if (onUpdated) {
          onUpdated(); // Send role to parent
        }
      } catch (error: any) {
        const message = error?.message || "Something went wrong";
        if (onError) {
          onError(message);
        }
      }
    }
    console.log('Deleted user:', userToDelete);
    // Add logic to delete the user (e.g., API call)
    handleDeleteDialogClose();
  };

  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const showStudentColumn = selectedRole === Role.STUDENT || rows.some(row => row.role === Role.STUDENT);

  const handleRowClick = (user: UserResponse) => {
    // Navigate to user-detail page with userId as query parameter
    router.push(`/dashboard/user/user-detail?userId=${user.userId}`);
  };

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '900px' }}>
          <TableHead>
            <TableRow>
              {/* <TableCell padding="checkbox">
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
              </TableCell> */}
              <TableCell sx={{ paddingLeft: '48px' }}>ชื่อ-นามสกุล</TableCell>
              <TableCell>ชื่อบัญชีผู้ใช้</TableCell>
              {showStudentColumn && <TableCell>รหัสผู้เรียน</TableCell>}
              <TableCell>อีเมล</TableCell>
              <TableCell>บทบาท</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected.has(row.username);

              return (
                <TableRow
                  hover
                  key={row.username}
                  selected={isSelected}
                  sx={{ cursor: 'pointer' }} // shows pointer on hover
                  onClick={() => handleRowClick(row)}
                >
                  {/* <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          selectOne(row.id);
                        } else {
                          deselectOne(row.id);
                        }
                      }}
                    />
                  </TableCell> */}
                  <TableCell sx={{ paddingLeft: '48px' }}>{row.nameTh} {row.surnameTh}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  {/* Show studentNo only for STUDENT */}
                  {showStudentColumn && (
                    <TableCell>{row.role === Role.STUDENT ? row.studentProfile?.studentNo || '-' : ''}</TableCell>
                  )}
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{getRoleLabel(row.role)}</TableCell>
                  {/* Update the IconButton onClick handlers to stop propagation */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleOpenEditDialog(row);
                        }}
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
                          e.stopPropagation(); // Prevent row click
                          handleDeleteDialogOpen(row);
                        }}
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
      {/* <TablePagination
        component="div"
        count={count}
        onPageChange={noop}
        onRowsPerPageChange={noop}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      /> */}

      {/* Dialog for editing user */}
      <Dialog open={openEditDialog} onClose={handleEditDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>เเก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="ชื่อบัญชีผู้ใช้"
              value={selectedUser?.username || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, nameTh: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
              disabled // Username should not be editable
            />
            <TextField
              label="ชื่อ (ภาษาไทย)"
              value={selectedUser?.nameTh || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, nameTh: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField
              label="นามสกุล (ภาษาไทย)"
              value={selectedUser?.surnameTh || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, surnameTh: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField
              label="ชื่อ (ภาษาอังกฤษ)"
              value={selectedUser?.nameEn || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, nameEn: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField
              label="นามสกุล (ภาษาอังกฤษ)"
              value={selectedUser?.surnameEn || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, surnameEn: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField
              label="รหัสผู้ใช้"
              value={selectedUser?.password || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, password: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField
              label="อีเมล"
              value={selectedUser?.email || ''}
              onChange={(e) => {
                setSelectedUser((prev) => (prev ? { ...prev, email: e.target.value } : null));
                // Clear error when user starts typing
                if (emailError) {
                  setEmailError('');
                }
              }}
              onBlur={() => selectedUser?.email && validateEmail(selectedUser.email)}
              fullWidth
              error={Boolean(emailError)}
              helperText={emailError}
              type="email"
            />
            <Select
              label="บทบาท"
              value={selectedUser?.role || ''}
              onChange={(e) =>
                setSelectedUser((prev) => {
                  if (!prev) return null;
                  const newRole = e.target.value;
                  // Clear studentNo if role is not STUDENT
                  const updatedStudentProfile =
                    newRole === Role.STUDENT
                      ? prev.studentProfile
                      : { ...prev.studentProfile, studentNo: '' };

                  return {
                    ...prev,
                    role: newRole,
                    studentProfile: updatedStudentProfile,
                  };
                })
              }
              fullWidth
            >
              <MenuItem value={Role.ADMIN}>{getRoleLabel(Role.ADMIN)}</MenuItem>
              <MenuItem value={Role.STAFF}>{getRoleLabel(Role.STAFF)}</MenuItem>
              <MenuItem value={Role.LECTURER}>{getRoleLabel(Role.LECTURER)}</MenuItem>
              <MenuItem value={Role.STUDENT}>{getRoleLabel(Role.STUDENT)}</MenuItem>
            </Select>
            {/* Show studentNo field only if role is STUDENT */}
            {selectedUser?.role === Role.STUDENT && (
              <TextField
                label="รหัสผู้เรียน"
                value={selectedUser?.studentProfile?.studentNo || ''}
                onChange={(e) =>
                  setSelectedUser((prev) =>
                    prev
                      ? {
                        ...prev,
                        studentProfile: {
                          ...prev.studentProfile,
                          studentNo: e.target.value,
                        },
                      }
                      : null
                  )
                }
                fullWidth
                error={!selectedUser?.studentProfile?.studentNo?.trim()}
                helperText={
                  !selectedUser?.studentProfile?.studentNo?.trim() ? "กรุณากรอกรหัสผู้เรียน" : ""
                }
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={(selectedUser?.role === Role.STUDENT && !selectedUser?.studentProfile?.studentNo?.trim()) || Boolean(emailError)}>
            เเก้ไข
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose} fullWidth maxWidth="xs">
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบผู้ใช้งาน <strong>{userToDelete?.nameTh} {userToDelete?.surnameTh}</strong> ใช่หรือไม่?
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
