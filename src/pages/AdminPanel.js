import React, { useState } from 'react';
import {
  Box, Button, TextField, Grid, InputLabel, MenuItem, Select, FormControl, 
  Typography, Alert, Paper, IconButton, Card, CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ArrowBack, CloudUpload, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    expiry: null,
    primary_owner: '',
    secondary_owner: '',
    lob: '',
    file: null
  });
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (newDate) => {
    setForm({ ...form, expiry: newDate });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setStatus({ success: false, message: 'File size must be less than 10MB' });
        return;
      }
      setForm({ ...form, file });
      setStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
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
        setStatus({ success: true, message: 'Procedure uploaded successfully!' });
        // Reset form
        setForm({ 
          name: '', 
          expiry: null, 
          primary_owner: '', 
          secondary_owner: '', 
          lob: '', 
          file: null 
        });
        // Clear file input
        document.getElementById('file-input').value = '';
      } else {
        const err = await res.json();
        setStatus({ success: false, message: err.message || 'Upload failed.' });
      }
    } catch (err) {
      setStatus({ success: false, message: 'Server error during upload.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Paper sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
        </Box>

        <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudUpload sx={{ mr: 1 }} />
              Upload New Procedure
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in all required fields and upload a PDF or Word document containing the procedure details.
              The system will automatically analyze the document and assign a compliance score.
            </Typography>
          </CardContent>
        </Card>

        {status && (
          <Alert 
            severity={status.success ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            icon={status.success ? <CheckCircle /> : null}
            onClose={() => setStatus(null)}
          >
            {status.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Procedure Name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                variant="outlined"
                helperText="Enter a clear, descriptive name for the procedure"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Primary Owner" 
                name="primary_owner" 
                value={form.primary_owner} 
                onChange={handleChange} 
                required 
                variant="outlined"
                helperText="Staff ID or name of primary owner"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Secondary Owner" 
                name="secondary_owner" 
                value={form.secondary_owner} 
                onChange={handleChange}
                variant="outlined"
                helperText="Staff ID or name of secondary owner" 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined">
                <InputLabel>Line of Business</InputLabel>
                <Select 
                  name="lob" 
                  value={form.lob} 
                  onChange={handleChange}
                  label="Line of Business"
                >
                  <MenuItem value="">Select LOB</MenuItem>
                  <MenuItem value="IWPB">IWPB - International Wealth & Private Banking</MenuItem>
                  <MenuItem value="CIB">CIB - Commercial & Institutional Banking</MenuItem>
                  <MenuItem value="GCOO">GCOO - Global Corporates & Operating Offices</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Expiry Date"
                value={form.expiry}
                onChange={handleDateChange}
                minDate={dayjs()}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    required: true,
                    variant: "outlined",
                    helperText: "Select when this procedure expires"
                  } 
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ 
                border: '2px dashed #ccc', 
                borderRadius: 2, 
                p: 3, 
                textAlign: 'center',
                bgcolor: '#fafafa'
              }}>
                <input
                  type="file"
                  id="file-input"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required={!form.file}
                />
                <label htmlFor="file-input">
                  <Button 
                    variant="contained" 
                    component="span"
                    startIcon={<CloudUpload />}
                    size="large"
                  >
                    Choose File
                  </Button>
                </label>
                {form.file && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" color="success.main">
                      ✓ {form.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Size: {(form.file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                  Accepted formats: PDF, DOC, DOCX (Max 10MB)
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={uploading}
                  sx={{ minWidth: 150 }}
                >
                  {uploading ? 'Uploading...' : 'Upload Procedure'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminPanel;