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

function noop(): void {
  // do nothing
}

export interface Customer {
  id: string;
  avatar: string;
  name: string;
  email: string;
  address: { city: string; state: string; country: string; street: string };
  phone: string;
  createdAt: Date;
}

interface UsersTableProps {
  count?: number;
  page?: number;
  rows?: Customer[];
  rowsPerPage?: number;
}

export function UsersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
}: UsersTableProps): React.JSX.Element {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Customer | null>(null);


  // Calculate selectedAll and selectedSome
  const selectedAll = rows.length > 0 && selected.size === rows.length;
  const selectedSome = selected.size > 0 && selected.size < rows.length;

  // Functions to handle selection
  const selectAll = () => {
    setSelected(new Set(rows.map((row) => row.id)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const selectOne = (id: string) => {
    setSelected((prev) => new Set(prev).add(id));
  };

  const deselectOne = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleOpenEditDialog = (user: Customer) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
  };

  const handleSave = () => {
    // Handle save logic here (e.g., API call to update user data)
    console.log('Updated user:', selectedUser);
    handleEditDialogClose();
  };

  const handleDeleteDialogOpen = (user: Customer) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = () => {
    console.log('Deleted user:', userToDelete);
    // Add logic to delete the user (e.g., API call)
    handleDeleteDialogClose();
  };

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '900px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
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
              </TableCell>
              <TableCell>ชื่อ-นามสกุล</TableCell>
              <TableCell>ชื่อบัญชีผู้ใช้</TableCell>
              <TableCell>อีเมล</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>บทบาท</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected.has(row.id);

              return (
                <TableRow hover key={row.id} selected={isSelected}>
                  <TableCell padding="checkbox">
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
                  </TableCell>
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Avatar src={row.avatar} />
                      <Typography variant="subtitle2">{row.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {row.address.city}, {row.address.state}, {row.address.country}
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{dayjs(row.createdAt).format('MMM D, YYYY')}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(row)} // Open dialog with user data
                      >
                        <img
                          src="/assets/edit.png"
                          alt="Edit"
                          style={{ width: 20, height: 20 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDialogOpen(row)}
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
              label="ชื่อ-นามสกุล"
              value={selectedUser?.name || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              fullWidth
              sx={{ marginTop: '8px' }}
            />
            <TextField
              label="อีเมล"
              value={selectedUser?.email || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, email: e.target.value } : null))
              }
              fullWidth
            />
            <TextField
              label="บทบาท"
              value={selectedUser?.phone || ''}
              onChange={(e) =>
                setSelectedUser((prev) => (prev ? { ...prev, phone: e.target.value } : null))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose} fullWidth maxWidth="xs">
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบผู้ใช้งาน <strong>{userToDelete?.name}</strong> ใช่หรือไม่?
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

// ----------------------------------------------------------------------