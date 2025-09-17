import * as React from 'react';
import { useState } from 'react';
import { TextField, Button, Stack, Typography } from '@mui/material';
import { User } from '@/types/user';

interface UserEditFormProps {
  user: User;
  onSubmit: (updatedUser: User) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ user, onSubmit }) => {
    const [id, setId] = useState(user.id);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const updatedUser = {
      ...user,
      id,
      name,
      email,
      avatar,
    };
    onSubmit(updatedUser);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="h5">Edit User</Typography>
        <TextField
          label="Id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Avatar"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value )}
          fullWidth
          required
        />
        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => onSubmit(user)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};

export default UserEditForm;