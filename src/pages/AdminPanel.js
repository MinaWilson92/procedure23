import React, { useState } from 'react';
import {
  Box, Button, TextField, Grid, InputLabel, MenuItem, Select, FormControl, Typography, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const AdminPanel = () => {
  const [form, setForm] = useState({
    name: '',
    expiry: null,
    primary_owner: '',
    secondary_owner: '',
    lob: '',
    file: null
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (newDate) => {
    setForm({ ...form, expiry: newDate });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'expiry' && value) {
        formData.append(key, dayjs(value).format('YYYY-MM-DD'));
      } else if (value) {
        formData.append(key, value);
      }
    });

    try {
      const res = await fetch('/ProceduresHubEG6/api/procedures', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setStatus({ success: true, message: 'Procedure uploaded successfully.' });
        setForm({ name: '', expiry: null, primary_owner: '', secondary_owner: '', lob: '', file: null });
      } else {
        const err = await res.json();
        setStatus({ success: false, message: err.message || 'Upload failed.' });
      }
    } catch (err) {
      setStatus({ success: false, message: 'Server error during upload.' });
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h5" gutterBottom>Admin Panel: Upload New Procedure</Typography>
      {status && (
        <Alert severity={status.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {status.message}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Procedure Name" name="name" value={form.name} onChange={handleChange} required /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Primary Owner" name="primary_owner" value={form.primary_owner} onChange={handleChange} required /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Secondary Owner" name="secondary_owner" value={form.secondary_owner} onChange={handleChange} /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Line of Business</InputLabel>
              <Select name="lob" value={form.lob} onChange={handleChange}>
                <MenuItem value="IWPB">IWPB</MenuItem>
                <MenuItem value="CIB">CIB</MenuItem>
                <MenuItem value="GCOO">GCOO</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <DatePicker
              label="Expiry Date"
              value={form.expiry}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" component="label">
              Upload File
              <input type="file" name="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileChange} />
            </Button>
            {form.file && <Typography variant="body2" sx={{ mt: 1 }}>{form.file.name}</Typography>}
          </Grid>
          <Grid item xs={12}><Button type="submit" variant="contained" fullWidth>Submit</Button></Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AdminPanel;
