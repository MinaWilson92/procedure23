const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Path to your JSON DB
const PROCEDURES_PATH = path.join(__dirname, 'data', 'procedures.json');

// Email configuration - set these as environment variables in production
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
const EMAIL_USER = process.env.EMAIL_USER || 'your.email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'yourpassword';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const APP_URL = process.env.APP_URL || 'http://localhost:44557';

// Only create transporter if email is enabled
let transporter = null;
if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
  
  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter verification failed:', error);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
}

// Function to send email notification
function sendExpiryNotification(procedure, daysUntilExpiry) {
  if (!EMAIL_ENABLED || !transporter) {
    console.log(`Would send email for ${procedure.name} (${daysUntilExpiry} days until expiry)`);
    return;
  }

  // In production, you'd get these from the procedure object or a user database
  const recipientEmails = [
    procedure.primary_owner_email || 'primary@example.com',
    procedure.secondary_owner_email || 'secondary@example.com'
  ].filter(email => email && email !== 'primary@example.com' && email !== 'secondary@example.com');

  if (recipientEmails.length === 0) {
    console.log(`No valid email addresses for procedure ${procedure.name}`);
    return;
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: recipientEmails.join(', '),
    subject: `[HSBC Procedures Hub] ${procedure.name} expires in ${daysUntilExpiry} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ee0000;">Procedure Expiry Notification</h2>
        
        <p>This is an automated reminder that the following procedure is expiring soon:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${procedure.name}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0;"><strong>Line of Business:</strong></td>
              <td>${procedure.lob}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Expiry Date:</strong></td>
              <td style="color: ${daysUntilExpiry <= 7 ? '#ee0000' : '#ff6600'};">
                ${new Date(procedure.expiry).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Days Until Expiry:</strong></td>
              <td><strong>${daysUntilExpiry} days</strong></td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Current Score:</strong></td>
              <td>${procedure.score || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Status:</strong></td>
              <td>${procedure.status || 'Active'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Primary Owner:</strong></td>
              <td>${procedure.primary_owner}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Secondary Owner:</strong></td>
              <td>${procedure.secondary_owner}</td>
            </tr>
          </table>
        </div>
        
        <p><strong>Action Required:</strong> Please review and update this procedure before the expiry date.</p>
        
        <p style="margin: 20px 0;">
          <a href="${APP_URL}/ProceduresHubEG6" 
             style="background-color: #ee0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Procedure in Hub
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="font-size: 12px; color: #666;">
          This is an automated message from HSBC Procedures Hub. 
          Please do not reply to this email.
        </p>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(`Failed to send email for ${procedure.name}:`, err);
    } else {
      console.log(`Email sent for ${procedure.name}:`, info.messageId);
    }
  });
}

// Function to check expiry and send alerts
function checkExpiringProcedures() {
  try {
    if (!fs.existsSync(PROCEDURES_PATH)) {
      console.log('Procedures file not found, skipping email check');
      return;
    }

    const data = JSON.parse(fs.readFileSync(PROCEDURES_PATH));
    const now = new Date();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Group procedures by days until expiry
    const expiryGroups = {
      expired: [],
      within7Days: [],
      within14Days: [],
      within30Days: []
    };

    data.forEach(proc => {
      const expiryDate = new Date(proc.expiry);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / ONE_DAY);

      if (daysUntilExpiry < 0) {
        expiryGroups.expired.push({ ...proc, daysUntilExpiry: Math.abs(daysUntilExpiry) });
      } else if (daysUntilExpiry <= 7) {
        expiryGroups.within7Days.push({ ...proc, daysUntilExpiry });
      } else if (daysUntilExpiry <= 14) {
        expiryGroups.within14Days.push({ ...proc, daysUntilExpiry });
      } else if (daysUntilExpiry <= 30) {
        expiryGroups.within30Days.push({ ...proc, daysUntilExpiry });
      }
    });

    console.log('Expiry check summary:');
    console.log(`- Expired: ${expiryGroups.expired.length}`);
    console.log(`- Expiring within 7 days: ${expiryGroups.within7Days.length}`);
    console.log(`- Expiring within 14 days: ${expiryGroups.within14Days.length}`);
    console.log(`- Expiring within 30 days: ${expiryGroups.within30Days.length}`);

    // Send notifications for procedures expiring within 7 days
    expiryGroups.within7Days.forEach(proc => {
      sendExpiryNotification(proc, proc.daysUntilExpiry);
    });

    // Optionally send weekly digest for 14-30 day expiries
    // This could be implemented as a separate function

  } catch (error) {
    console.error('Error in checkExpiringProcedures:', error);
  }
}

// Function to send a digest email (optional)
function sendWeeklyDigest() {
  // Implementation for weekly summary email
  console.log('Weekly digest functionality not yet implemented');
}

// Export function to initialize the scheduler
module.exports = function initializeScheduler() {
  // Schedule daily check at 8 AM
  cron.schedule('0 8 * * *', () => {
    console.log('Running daily expiry check...');
    checkExpiringProcedures();
  }, {
    scheduled: true,
    timezone: "Asia/Hong_Kong" // Adjust timezone as needed
  });

  // Schedule weekly digest every Monday at 9 AM (optional)
  cron.schedule('0 9 * * 1', () => {
    console.log('Running weekly digest...');
    sendWeeklyDigest();
  }, {
    scheduled: true,
    timezone: "Asia/Hong_Kong"
  });

  console.log('Email scheduler initialized');
  console.log('- Daily expiry check: 8:00 AM HKT');
  console.log('- Weekly digest: Mondays 9:00 AM HKT');
  console.log(`- Email notifications: ${EMAIL_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  
  // Only run initial check in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode: Running initial expiry check...');
    checkExpiringProcedures();
  }
};

// Export additional functions for manual triggering if needed
module.exports.checkExpiringProcedures = checkExpiringProcedures;
module.exports.sendWeeklyDigest = sendWeeklyDigest;