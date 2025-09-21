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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import dayjs from 'dayjs';
import { createUser, getUsers } from '@/api.js'; // Import the API function

import { config } from '@/config';
import type { User, UserRequest } from '@/components/dashboard/user/users-table';
import { UsersFilters } from '@/components/dashboard/user/users-filters';
import { UsersTable } from '@/components/dashboard/user/users-table';

// export const metadata = { title: `Customers | Dashboard | ${config.site.name}` } satisfies Metadata;

const mockUsers = [
  {
    id: 'USR-010',
    password: '123456',
    name: 'Alcides Antonio',
    avatar: '/assets/avatar-10.png',
    email: 'alcides.antonio@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-009',
    password: '123456',
    name: 'Marcus Finn',
    avatar: '/assets/avatar-9.png',
    email: 'marcus.finn@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-008',
    password: '123456',
    name: 'Jie Yan',
    avatar: '/assets/avatar-8.png',
    email: 'jie.yan.song@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-007',
    password: '123456',
    name: 'Nasimiyu Danai',
    avatar: '/assets/avatar-7.png',
    email: 'nasimiyu.danai@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-006',
    password: '123456',
    name: 'Iulia Albu',
    avatar: '/assets/avatar-6.png',
    email: 'iulia.albu@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-005',
    password: '123456',
    name: 'Fran Perez',
    avatar: '/assets/avatar-5.png',
    email: 'fran.perez@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'ADMIN',
  },

  {
    id: 'USR-004',
    password: '123456',
    name: 'Penjani Inyene',
    avatar: '/assets/avatar-4.png',
    email: 'penjani.inyene@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-003',
    password: '123456',
    name: 'Carson Darrin',
    avatar: '/assets/avatar-3.png',
    email: 'carson.darrin@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'USER',
  },
  {
    id: 'USR-002',
    password: '123456',
    name: 'Siegbert Gottfried',
    avatar: '/assets/avatar-2.png',
    email: 'siegbert.gottfried@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'ADMIN',
  },
  {
    id: 'USR-001',
    password: '123456',
    name: 'Miron Vitold',
    avatar: '/assets/avatar-1.png',
    email: 'miron.vitold@devias.io',
    // createdAt: dayjs().subtract(2, 'hours').toDate(),
    role: 'ADMIN',
  },
] satisfies User[];

export default function Page(): React.JSX.Element {
  const page = 0;
  const rowsPerPage = 5;

  const [users, setUsers] = useState<User[]>([]); // State to store users
  const paginatedCustomers = applyPagination(users, page, rowsPerPage);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState<UserRequest>({
    id: '',
    password: '',
    name: '',
    email: '',
    role
    : 'USER',
  });

  const fetchUsers = async () => {
    try {
      const response = await getUsers(); // Call the API to fetch users
      const user: User = {
        id: response.userId,
        password: response.password,
        name: response.name,
        email: response.email,
        role: response.role,
        avatar: ''
      };
      setUsers([user]); // Update the state with the fetched users
    } catch (error) {
      // In case of error, you might want to set an empty array or some default users
      setUsers(mockUsers);
      console.error('Error fetching users:', error);
    }
  };

  // Fetch users when the component mounts
  useEffect(() => {

    fetchUsers();
  }, []);

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setNewUser({
      id: '',
      password: '',
      name: '',
      email: '',
      role: 'USER',
    });
  };

  const handleSaveNewUser = async () => {
    try {
      const createdUser = await createUser(newUser); // Call the createUser API
      fetchUsers(); // Refresh the user list after creating a new user
      console.log('New user created:', createdUser);
      handleCloseCreateDialog(); // Close the dialog
    } catch (error: any) {
      console.error('Error creating user:', error.message);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">ข้อมูลผู้ใช้งาน</Typography>
          {/* <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Import
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Export
            </Button>
          </Stack> */}
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
      <UsersTable
        count={users.length} // Pass the total count of customers
        page={0} // No pagination, so page is irrelevant
        rows={users} // Pass all customers directly
        rowsPerPage={users.length} // Set rowsPerPage to the total number of customers
        onUpdateSuccess={fetchUsers} // Refresh the user list after an update
        onDeleteSuccess={fetchUsers} // Refresh the user list after a delete
      />
      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>เพิ่มผู้ใช้งาน</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="บัญชีผู้ใช้งาน"
              value={newUser.id}
              onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
              fullWidth
            />
            <TextField
              label="รหัสผ่าน"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="ชื่อ-นามสกุล"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="USER">USER</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveNewUser}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function applyPagination(rows: User[], page: number, rowsPerPage: number): User[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
