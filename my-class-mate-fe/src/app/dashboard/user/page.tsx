'use client';

import React, { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertColor } from "@mui/material/Alert";


import { createUser, exportUsers, getUsers, importUsers, downloadUserTemplate } from '@/api/user-api'; // Import the API function
import { UsersFilters } from '@/components/dashboard/user/users-filters';
import { UsersTable } from '@/components/dashboard/user/users-table';
import ErrorDialog from '@/components/error/error-dialog';
import { getRoleLabel, Role } from '@/util/role-enum';
import { UploadIcon } from '@phosphor-icons/react';
import { UserRequest, UserResponse } from '@/api/data/user-response';

export default function Page(): React.JSX.Element {
  const page = 0;
  const rowsPerPage = 5;

  const [users, setUsers] = useState<UserResponse[]>([]); // State to store users
  const [selectedRole, setSelectedRole] = useState<Role>(Role.STUDENT); // Role filter

  // const paginatedCustomers = applyPagination(users, page, rowsPerPage);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState<UserRequest>({
    username: '',
    password: '',
    nameTh: '',
    surnameTh: '',
    nameEn: '',
    surnameEn: '',
    email: '',
    role: Role.STUDENT,
  });

  const isStudentRole = newUser.role === Role.STUDENT;
  const isStudentNoEmpty = isStudentRole && !newUser.studentNo?.trim();

  const fetchUsers = async () => {
    try {
      const response = await getUsers(selectedRole); // Call the API to fetch users
      setUsers(response); // Update the state with the fetched users
    } catch (error) {
      // In case of error, you might want to set an empty array or some default users
      setErrorMessage((error as Error).message);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleRoleFilterChange = (event: SelectChangeEvent<Role>) => {
    setSelectedRole(event.target.value);
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setNewUser({
      username: '',
      password: '',
      nameTh: '',
      surnameTh: '',
      nameEn: '',
      surnameEn: '',
      email: '',
      role: Role.STUDENT,
    });
  };

  const handleSaveNewUser = async () => {
    try {
      const createdUser = await createUser(newUser); // Call the createUser API
      if (newUser.role !== selectedRole) {
        setSelectedRole(newUser.role); // trigger fetchUsers via useEffect
      } else {
        fetchUsers(); // Refresh the user list after creation
      }
      handleCloseCreateDialog(); // Close the dialog
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCloseErrorDialog = () => {
    setErrorMessage(null);
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Call your backend API to import users from XLSX
      const res = await importUsers(file);
      showToast(`นำเข้าไฟล์สำเร็จ: ${res.createdRow} แถวใหม่, ${res.updatedRow} แถวอัปเดตแล้ว`);
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const Alert = React.forwardRef<HTMLDivElement, { severity: AlertColor; children: React.ReactNode }>(
    function Alert(props, ref) {
      return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    }
  );

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message: string, severity: AlertColor = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };


  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">ข้อมูลผู้ใช้งาน</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              color="inherit"
              startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={async () => {
                try {
                  await downloadUserTemplate();
                } catch (err: any) {
                  console.error("Error downloading template:", err.message);
                  setErrorMessage(err.message);
                }
              }}
            >
              Download Template
            </Button>
            <Button
              color="inherit"
              startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={handleImportClick}
            >
              Import
            </Button>
            <Button
              color="inherit"
              startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={async () => {
                try {
                  await exportUsers(selectedRole);
                } catch (err: any) {
                  console.error("Error exporting users:", err.message);
                  setErrorMessage(err.message);
                }
              }}
            >
              Export
            </Button>
            <input
              type="file"
              accept=".xlsx"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </Stack>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            onClick={handleOpenCreateDialog}
          >
            เพิ่มผู้ใช้งาน
          </Button>
        </div>
      </Stack>
      {/* <UsersFilters /> */}
      {/* Role filter dropdown */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography>กรองตามบทบาท:</Typography>
        <Select value={selectedRole} onChange={handleRoleFilterChange} size="small">
          <MenuItem value={Role.ALL}>ทั้งหมด</MenuItem>
          <MenuItem value={Role.ADMIN}>{getRoleLabel(Role.ADMIN)}</MenuItem>
          <MenuItem value={Role.STAFF}>{getRoleLabel(Role.STAFF)}</MenuItem>
          <MenuItem value={Role.LECTURER}>{getRoleLabel(Role.LECTURER)}</MenuItem>
          <MenuItem value={Role.STUDENT}>{getRoleLabel(Role.STUDENT)}</MenuItem>
        </Select>
      </Stack>
      {/* ✅ Show "no user" text if empty */}
      {users.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          ไม่มีผู้ใช้งานในระบบ
        </Typography>
      ) : (
        <UsersTable
          count={users.length}
          page={0}
          rows={users}
          rowsPerPage={users.length}
          onUpdated={fetchUsers}
          onError={setErrorMessage}
        />
      )}
      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>เพิ่มผู้ใช้งาน</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="บัญชีผู้ใช้งาน"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="รหัสผ่าน"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="ชื่อ (ภาษาไทย)"
              value={newUser.nameTh}
              onChange={(e) => setNewUser({ ...newUser, nameTh: e.target.value })}
              fullWidth
            />
            <TextField
              label="นามสกุล (ภาษาไทย)"
              value={newUser.surnameTh}
              onChange={(e) => setNewUser({ ...newUser, surnameTh: e.target.value })}
              fullWidth
            />
            <TextField
              label="ชื่อ (ภาษาอังกฤษ)"
              value={newUser.nameEn}
              onChange={(e) => setNewUser({ ...newUser, nameEn: e.target.value })}
              fullWidth
            />
            <TextField
              label="นามสกุล (ภาษาอังกฤษ)"
              value={newUser.surnameEn}
              onChange={(e) => setNewUser({ ...newUser, surnameEn: e.target.value })}
              fullWidth
            />
            <TextField
              label="อีเมล"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              fullWidth
            />
            <Select
              label="บทบาท"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              fullWidth
            >
              <MenuItem value={Role.ADMIN}>{getRoleLabel(Role.ADMIN)}</MenuItem>
              <MenuItem value={Role.STAFF}>{getRoleLabel(Role.STAFF)}</MenuItem>
              <MenuItem value={Role.LECTURER}>{getRoleLabel(Role.LECTURER)}</MenuItem>
              <MenuItem value={Role.STUDENT}>{getRoleLabel(Role.STUDENT)}</MenuItem>
            </Select>
            {/* ✅ Show only if role is STUDENT */}
            {isStudentRole && (
              <>
                <TextField
                  label="รหัสนักศึกษา"
                  value={newUser.studentNo || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, studentNo: e.target.value })
                  }
                  fullWidth
                  error={isStudentNoEmpty}
                  helperText={isStudentNoEmpty ? "กรุณากรอกรหัสนักศึกษา" : ""}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveNewUser} disabled={isStudentNoEmpty}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
      <ErrorDialog
        open={Boolean(errorMessage)}
        message={errorMessage}
        onClose={handleCloseErrorDialog}
      />
      <Snackbar
        open={toast.open}
        autoHideDuration={8000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert onClose={handleCloseToast} severity={toast.severity}>
          {toast.message}
        </MuiAlert>
      </Snackbar>
    </Stack>
  );
}

// function applyPagination(rows: UserResponse[], page: number, rowsPerPage: number): UserResponse[] {
//   return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
// }
