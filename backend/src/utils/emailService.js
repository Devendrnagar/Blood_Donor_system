import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
    }
  });

  return transporter;
};

// Send email
export const sendEmail = async (options) => {
  try {
    console.log('📧 Attempting to send email to:', options.email);
    
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@blooddonation.com',
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', {
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
      port: process.env.EMAIL_PORT || process.env.SMTP_PORT,
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      hasPassword: !!(process.env.EMAIL_PASS || process.env.SMTP_PASS)
    });
    
    // Don't expose sensitive error details to client
    const clientError = new Error('Failed to send email');
    clientError.code = error.code;
    throw clientError;
  }
};

// Send notification email to donors
export const sendDonorNotification = async (donor, bloodRequest) => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e53e3e;">🩸 Blood Donation Request</h2>
      <p>Dear ${donor.user.fullName},</p>
      <p>There's an urgent blood donation request that matches your blood type!</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Request Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Patient:</strong> ${bloodRequest.patientName}</li>
          <li><strong>Blood Type:</strong> ${bloodRequest.bloodType}</li>
          <li><strong>Units Needed:</strong> ${bloodRequest.unitsNeeded}</li>
          <li><strong>Urgency:</strong> ${bloodRequest.urgency.toUpperCase()}</li>
          <li><strong>Hospital:</strong> ${bloodRequest.hospital.name}</li>
          <li><strong>Location:</strong> ${bloodRequest.hospital.address.city}, ${bloodRequest.hospital.address.state}</li>
          <li><strong>Required By:</strong> ${new Date(bloodRequest.requiredBy).toLocaleDateString()}</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/requests/${bloodRequest._id}" 
           style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Request & Respond
        </a>
      </div>

      <p>Your help can save a life! Please respond as soon as possible if you're available to donate.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>You received this email because you're registered as a blood donor in our system. If you no longer wish to receive these notifications, you can update your preferences in your donor profile.</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: donor.user.email,
    subject: `🚨 Urgent: ${bloodRequest.bloodType} Blood Donation Needed`,
    html: message
  });
};

// Send request confirmation email
export const sendRequestConfirmation = async (requester, bloodRequest) => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e53e3e;">🩸 Blood Request Submitted Successfully</h2>
      <p>Dear ${requester.fullName},</p>
      <p>Your blood donation request has been submitted successfully. We'll notify matching donors in your area.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Your Request Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Request ID:</strong> ${bloodRequest._id}</li>
          <li><strong>Patient:</strong> ${bloodRequest.patientName}</li>
          <li><strong>Blood Type:</strong> ${bloodRequest.bloodType}</li>
          <li><strong>Units Needed:</strong> ${bloodRequest.unitsNeeded}</li>
          <li><strong>Required By:</strong> ${new Date(bloodRequest.requiredBy).toLocaleDateString()}</li>
          <li><strong>Hospital:</strong> ${bloodRequest.hospital.name}</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/my-requests" 
           style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Track Your Request
        </a>
      </div>

      <p>We'll keep you updated on any responses from donors. You can also track the status of your request in your dashboard.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>If you have any questions or need to update your request, please contact us or log into your account.</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: requester.email,
    subject: 'Blood Donation Request Confirmation',
    html: message
  });
};

// Send donation certificate email
export const sendCertificateEmail = async (donor, certificate) => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e53e3e;">🏆 Thank You for Your Life-Saving Donation!</h2>
      <p>Dear ${donor.fullName},</p>
      <p>Thank you for your generous blood donation! Your certificate of appreciation is now ready.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Donation Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Certificate ID:</strong> ${certificate.certificateId}</li>
          <li><strong>Donation Date:</strong> ${new Date(certificate.donationDetails.donationDate).toLocaleDateString()}</li>
          <li><strong>Blood Type:</strong> ${certificate.donationDetails.bloodType}</li>
          <li><strong>Volume:</strong> ${certificate.donationDetails.volumeDonated}ml</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/certificates/${certificate._id}/download" 
           style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Download Certificate
        </a>
      </div>

      <p>You can also view and share your certificate from your dashboard. Your contribution has made a real difference in someone's life!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>Keep up the great work! Regular blood donation helps maintain adequate blood supplies for those in need.</p>
      </div>
    </div>
  `;

  return sendEmail({
    email: donor.email,
    subject: '🏆 Your Blood Donation Certificate is Ready!',
    html: message
  });
};
