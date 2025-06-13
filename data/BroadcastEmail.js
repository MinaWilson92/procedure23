// components/email/BroadcastEmail.js - FIXED CLEAN VERSION
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  Alert, List, ListItem, ListItemText
} from '@mui/material';
import {
  Send, Refresh, Preview
} from '@mui/icons-material';

const BroadcastEmail = ({ emailService }) => {
  const [recipients, setRecipients] = useState({
    admins: false,
    primaryOwners: false,
    secondaryOwners: false
  });
  
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  
  const [recipientList, setRecipientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const emails = new Set();
      
      // Load admins from UserRoles
      if (recipients.admins) {
        const adminResponse = await fetch(
          'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'UserRoles\')/items?$filter=UserRole eq \'admin\' and Status eq \'active\'&$select=Email,DisplayName,Title',
          {
            headers: { 'Accept': 'application/json; odata=verbose' },
            credentials: 'same-origin'
          }
        );
        
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          adminData.d.results.forEach(user => {
            const email = user.Email || `${user.Title}@hsbc.com`;
            emails.add(`${user.DisplayName || user.Title} <${email}>`);
          });
        }
      }
      
      // Load procedure owners
      if (recipients.primaryOwners || recipients.secondaryOwners) {
        const proceduresResponse = await fetch(
          'https://teams.global.hsbc/sites/EmployeeEng/_api/web/lists/getbytitle(\'Procedures\')/items?$select=PrimaryOwner,PrimaryOwnerEmail,SecondaryOwner,SecondaryOwnerEmail',
          {
            headers: { 'Accept': 'application/json; odata=verbose' },
            credentials: 'same-origin'
          }
        );
        
        if (proceduresResponse.ok) {
          const proceduresData = await proceduresResponse.json();
          proceduresData.d.results.forEach(proc => {
            if (recipients.primaryOwners && proc.PrimaryOwnerEmail) {
              emails.add(`${proc.PrimaryOwner} <${proc.PrimaryOwnerEmail}>`);
            }
            if (recipients.secondaryOwners && proc.SecondaryOwnerEmail) {
              emails.add(`${proc.SecondaryOwner} <${proc.SecondaryOwnerEmail}>`);
            }
          });
        }
      }
      
      setRecipientList(Array.from(emails));
      
    } catch (error) {
      console.error('❌ Failed to load recipients:', error);
      setMessage({ type: 'error', text: 'Failed to load recipients' });
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcastEmail = async () => {
    try {
      setLoading(true);
      
      if (recipientList.length === 0) {
        setMessage({ type: 'error', text: 'No recipients selected' });
        return;
      }
      
      if (!emailContent.subject || !emailContent.message) {
        setMessage({ type: 'error', text: 'Subject and message are required' });
        return;
      }
      
      // Extract email addresses from formatted strings
      const emailAddresses = recipientList.map(recipient => {
        const match = recipient.match(/<(.+)>/);
        return match ? match[1] : recipient;
      });
      
      // Send broadcast email
      const result = await emailService.sendEmailViaSharePoint({
        to: emailAddresses,
        subject: `[BROADCAST] ${emailContent.subject}`,
        body: generateBroadcastEmailHTML(emailContent)
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: `Broadcast email sent to ${emailAddresses.length} recipients!` });
        
        // Reset form
        setEmailContent({ subject: '', message: '', priority: 'normal' });
        setRecipients({ admins: false, primaryOwners: false, secondaryOwners: false });
        setRecipientList([]);
      } else {
        setMessage({ type: 'error', text: 'Failed to send broadcast email: ' + result.message });
      }
      
    } catch (error) {
      console.error('❌ Broadcast email failed:', error);
      setMessage({ type: 'error', text: 'Broadcast email failed: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const generateBroadcastEmailHTML = (content) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d40000, #b30000); padding: 20px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">HSBC Procedures Hub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Broadcast Message</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #d40000; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0; color: #d40000;">${content.subject}</h2>
            <div style="color: #666; line-height: 1.6;">
              ${content.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 4px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This is a broadcast message from the HSBC Procedures Hub administration.
            </p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
             Sent: ${new Date().toLocaleString()}
           </p>
         </div>
       </div>
     </div>
   `;
 };

 useEffect(() => {
   if (Object.values(recipients).some(Boolean)) {
     loadRecipients();
   } else {
     setRecipientList([]);
   }
 }, [recipients]);

 return (
   <Box>
     <Typography variant="h5" gutterBottom>
       📢 Broadcast Email System
     </Typography>
     
     {message && (
       <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
         {message.text}
       </Alert>
     )}

     <Grid container spacing={3}>
       {/* Recipient Selection */}
       <Grid item xs={12} md={6}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               👥 Select Recipients
             </Typography>
             
             <FormControlLabel
               control={
                 <Checkbox
                   checked={recipients.admins}
                   onChange={(e) => setRecipients({...recipients, admins: e.target.checked})}
                 />
               }
               label="🔑 System Admins"
             />
             
             <FormControlLabel
               control={
                 <Checkbox
                   checked={recipients.primaryOwners}
                   onChange={(e) => setRecipients({...recipients, primaryOwners: e.target.checked})}
                 />
               }
               label="👤 Primary Owners"
             />
             
             <FormControlLabel
               control={
                 <Checkbox
                   checked={recipients.secondaryOwners}
                   onChange={(e) => setRecipients({...recipients, secondaryOwners: e.target.checked})}
                 />
               }
               label="👥 Secondary Owners"
             />

             <Box sx={{ mt: 2 }}>
               <Button
                 variant="outlined"
                 startIcon={<Refresh />}
                 onClick={loadRecipients}
                 disabled={loading}
                 size="small"
               >
                 Refresh Recipients
               </Button>
             </Box>

             {recipientList.length > 0 && (
               <Box sx={{ mt: 2 }}>
                 <Typography variant="subtitle2" gutterBottom>
                   📧 Recipients ({recipientList.length}):
                 </Typography>
                 <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                   {recipientList.map((recipient, index) => (
                     <ListItem key={index} sx={{ py: 0.5 }}>
                       <ListItemText 
                         primary={recipient} 
                         primaryTypographyProps={{ variant: 'body2' }}
                       />
                     </ListItem>
                   ))}
                 </List>
               </Box>
             )}
           </CardContent>
         </Card>
       </Grid>

       {/* Email Content */}
       <Grid item xs={12} md={6}>
         <Card>
           <CardContent>
             <Typography variant="h6" gutterBottom>
               ✉️ Email Content
             </Typography>
             
             <TextField
               fullWidth
               label="Subject"
               value={emailContent.subject}
               onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
               sx={{ mb: 2 }}
               placeholder="Enter broadcast subject"
             />
             
             <TextField
               fullWidth
               multiline
               rows={8}
               label="Message"
               value={emailContent.message}
               onChange={(e) => setEmailContent({...emailContent, message: e.target.value})}
               sx={{ mb: 2 }}
               placeholder="Enter your broadcast message here..."
               helperText="Plain text message - line breaks will be preserved"
             />
             
             <FormControl fullWidth sx={{ mb: 2 }}>
               <InputLabel>Priority</InputLabel>
               <Select
                 value={emailContent.priority}
                 onChange={(e) => setEmailContent({...emailContent, priority: e.target.value})}
                 label="Priority"
               >
                 <MenuItem value="low">🔵 Low Priority</MenuItem>
                 <MenuItem value="normal">⚪ Normal Priority</MenuItem>
                 <MenuItem value="high">🔴 High Priority</MenuItem>
                 <MenuItem value="urgent">🚨 Urgent</MenuItem>
               </Select>
             </FormControl>

             <Grid container spacing={2}>
               <Grid item xs={6}>
                 <Button
                   fullWidth
                   variant="outlined"
                   startIcon={<Preview />}
                   disabled={!emailContent.subject || !emailContent.message}
                   onClick={() => {
                     const preview = generateBroadcastEmailHTML(emailContent);
                     const newWindow = window.open('', '_blank');
                     newWindow.document.write(preview);
                     newWindow.document.close();
                   }}
                 >
                   Preview
                 </Button>
               </Grid>
               <Grid item xs={6}>
                 <Button
                   fullWidth
                   variant="contained"
                   startIcon={<Send />}
                   onClick={sendBroadcastEmail}
                   disabled={loading || recipientList.length === 0 || !emailContent.subject || !emailContent.message}
                   color="primary"
                 >
                   Send Broadcast
                 </Button>
               </Grid>
             </Grid>
           </CardContent>
         </Card>
       </Grid>
     </Grid>

     {/* Quick Broadcast Templates */}
     <Card sx={{ mt: 3 }}>
       <CardContent>
         <Typography variant="h6" gutterBottom>
           🚀 Quick Broadcast Templates
         </Typography>
         <Grid container spacing={2}>
           <Grid item xs={12} sm={6} md={3}>
             <Button
               fullWidth
               variant="outlined"
               onClick={() => setEmailContent({
                 ...emailContent,
                 subject: 'System Maintenance Notice',
                 message: 'The HSBC Procedures Hub will undergo scheduled maintenance on [DATE] from [TIME] to [TIME]. During this period, the system may be unavailable. We apologize for any inconvenience.'
               })}
             >
               🔧 Maintenance Notice
             </Button>
           </Grid>
           <Grid item xs={12} sm={6} md={3}>
             <Button
               fullWidth
               variant="outlined"
               onClick={() => setEmailContent({
                 ...emailContent,
                 subject: 'New Feature Announcement',
                 message: 'We are excited to announce new features in the HSBC Procedures Hub! [DESCRIBE FEATURES]. Please log in to explore these enhancements.'
               })}
             >
               🎉 New Features
             </Button>
           </Grid>
           <Grid item xs={12} sm={6} md={3}>
             <Button
               fullWidth
               variant="outlined"
               onClick={() => setEmailContent({
                 ...emailContent,
                 subject: 'Urgent: Policy Update Required',
                 message: 'URGENT: All procedure owners must review and update their procedures by [DATE] due to new regulatory requirements. Please prioritize this task.'
               })}
             >
               🚨 Urgent Update
             </Button>
           </Grid>
           <Grid item xs={12} sm={6} md={3}>
             <Button
               fullWidth
               variant="outlined"
               onClick={() => setEmailContent({
                 ...emailContent,
                 subject: 'Monthly Procedures Hub Report',
                 message: 'Monthly summary: [STATS]. Thank you for your continued participation in maintaining our procedures. For questions, contact the admin team.'
               })}
             >
               📊 Monthly Report
             </Button>
           </Grid>
         </Grid>
       </CardContent>
     </Card>
   </Box>
 );
};

export default BroadcastEmail;
