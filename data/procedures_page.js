// pages/ProceduresPage.js - Enhanced with Procedure Details Modal
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip,
  TextField, InputAdornment, FormControl, InputLabel, Select,
  MenuItem, Alert, IconButton, Tooltip, Badge
} from '@mui/material';
import {
  Search, FilterList, Refresh, Person, Business, CalendarToday,
  Visibility, CloudDownload, Schedule, Error as ErrorIcon,
  CheckCircle, Warning, Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigation } from '../contexts/NavigationContext';
import ProcedureDetailsModal from '../components/ProcedureDetailsModal'; // NEW

const ProceduresPage = ({ procedures = [], sharePointAvailable = false, onDataRefresh }) => {
  const { navigate } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLOB, setFilterLOB] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  
  // 🎯 **NEW: Modal State**
  const [selectedProcedureId, setSelectedProcedureId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const now = new Date();

  // 🎯 **NEW: Handle Procedure Card Click**
  const handleProcedureClick = (procedureId) => {
    console.log('🔍 Opening procedure details for ID:', procedureId);
    setSelectedProcedureId(procedureId);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedProcedureId(null);
  };

  // Enhanced status calculation
  const getStatusInfo = (expiry) => {
    const expiryDate = new Date(expiry);
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return {
        status: 'EXPIRED',
        color: '#f44336',
        icon: <ErrorIcon />,
        text: `EXPIRED (${Math.abs(daysLeft)} days ago)`,
        severity: 'error'
      };
    } else if (daysLeft <= 7) {
      return {
        status: 'CRITICAL',
        color: '#d32f2f',
        icon: <Warning />,
        text: `${daysLeft} days left`,
        severity: 'error'
      };
    } else if (daysLeft <= 30) {
      return {
        status: 'EXPIRING',
        color: '#ff9800',
        icon: <Schedule />,
        text: `${daysLeft} days left`,
        severity: 'warning'
      };
    } else {
      return {
        status: 'ACTIVE',
        color: '#4caf50',
        icon: <CheckCircle />,
        text: `${daysLeft} days left`,
        severity: 'success'
      };
    }
  };

  // Filter procedures based on search and filters
  const filteredProcedures = useMemo(() => {
    return procedures.filter(proc => {
      const matchesSearch = !searchTerm || 
        proc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.primary_owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.lob?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesLOB = !filterLOB || proc.lob === filterLOB;
      
      const statusInfo = getStatusInfo(proc.expiry);
      const matchesStatus = !filterStatus || statusInfo.status === filterStatus;
      
      const matchesRisk = !filterRisk || proc.risk_rating === filterRisk;
      
      return matchesSearch && matchesLOB && matchesStatus && matchesRisk;
    });
  }, [procedures, searchTerm, filterLOB, filterStatus, filterRisk]);

  // Get unique values for filters
  const uniqueLOBs = [...new Set(procedures.map(p => p.lob).filter(Boolean))];
  const uniqueRisks = [...new Set(procedures.map(p => p.risk_rating).filter(Boolean))];

  return (
    <Box>
      {/* Enhanced Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📄 All Procedures
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredProcedures.length} of {procedures.length} procedures
            {sharePointAvailable && (
              <Chip 
                label="Live Data" 
                size="small" 
                color="success" 
                variant="outlined" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onDataRefresh}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Enhanced Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            Filters & Search
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search procedures, owners, or LOB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>LOB</InputLabel>
                <Select
                  value={filterLOB}
                  onChange={(e) => setFilterLOB(e.target.value)}
                  label="LOB"
                >
                  <MenuItem value="">All LOBs</MenuItem>
                  {uniqueLOBs.map(lob => (
                    <MenuItem key={lob} value={lob}>{lob}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="EXPIRING">Expiring Soon</MenuItem>
                  <MenuItem value="CRITICAL">Critical (≤7 days)</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Risk</InputLabel>
                <Select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  label="Risk"
                >
                  <MenuItem value="">All Risk Levels</MenuItem>
                  {uniqueRisks.map(risk => (
                    <MenuItem key={risk} value={risk}>{risk}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLOB('');
                  setFilterStatus('');
                  setFilterRisk('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Procedures Grid */}
      <Grid container spacing={3}>
        {filteredProcedures.map((proc, index) => {
          const statusInfo = getStatusInfo(proc.expiry);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={proc.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    transform: 'translateY(-4px)'
                  }
                }}>
                  {/* 🎯 **NEW: Click Handler for Entire Card** */}
                  <CardContent 
                    sx={{ flex: 1, p: 3 }}
                    onClick={() => handleProcedureClick(proc.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ flex: 1, pr: 1 }}>
                        {proc.name}
                      </Typography>
                      {proc.score && (
                        <Tooltip title={`Quality Score: ${proc.score}%`}>
                          <Chip 
                            icon={<Star />}
                            label={`${proc.score}%`}
                            size="small"
                            color={proc.score >= 80 ? 'success' : proc.score >= 60 ? 'warning' : 'error'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    
                    {/* Status Badge */}
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        icon={statusInfo.icon}
                        label={statusInfo.text}
                        size="medium"
                        sx={{ 
                          backgroundColor: statusInfo.color,
                          color: 'white',
                          fontWeight: 'bold',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Box>

                    {/* Procedure Info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Business fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          LOB: <strong>{proc.lob}</strong>
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          Owner: {proc.primary_owner}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Expiry: {new Date(proc.expiry).toLocaleDateString()}
                        </Typography>
                      </Box>

                      {proc.risk_rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Warning fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Risk: <strong>{proc.risk_rating}</strong>
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Quality Score Progress */}
                    {proc.score && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Document Quality: <strong>{proc.score}%</strong>
                        </Typography>
                        <Box sx={{
                          width: '100%',
                          height: 8,
                          bgcolor: '#e0e0e0',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            width: `${proc.score}%`,
                            height: '100%',
                            bgcolor: proc.score >= 80 ? '#4caf50' : proc.score >= 60 ? '#ff9800' : '#f44336',
                            borderRadius: 4,
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                      </Box>
                    )}
                  </CardContent>

                  {/* Action Buttons */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleProcedureClick(proc.id);
                          }}
                        >
                          View Details
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<CloudDownload />}
                          disabled={!proc.file_link}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            if (proc.file_link) {
                              window.open(proc.file_link, '_blank');
                            }
                          }}
                        >
                          Download
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
      
      {/* No Results Message */}
      {filteredProcedures.length === 0 && procedures.length > 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Search sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No procedures match your filters
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search terms or filters to find what you're looking for.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => {
                setSearchTerm('');
                setFilterLOB('');
                setFilterStatus('');
                setFilterRisk('');
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {procedures.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Business sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No procedures found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Procedures will appear here once they are uploaded to the system.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 🎯 **NEW: Procedure Details Modal** */}
      <ProcedureDetailsModal
        open={showDetailsModal}
        onClose={handleCloseModal}
        procedureId={selectedProcedureId}
        sharePointAvailable={sharePointAvailable}
      />
    </Box>
  );
};

export default ProceduresPage;
