'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface ErrorDialogProps {
    open: boolean;
    message: string | null;
    onClose: () => void;
}

export default function ErrorDialog({ open, message, onClose }: ErrorDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
            <DialogContent>
                {message != null && (
                    <Typography color="error" sx={{ mt: 1 }}>
                        {message || 'มีบางอย่างผิดพลาด กรุณาลองใหม่'}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    ปิด
                </Button>
            </DialogActions>
        </Dialog>
    );
}
