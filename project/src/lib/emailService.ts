import { CertificateData } from './certificateService';

export class EmailService {

  static async sendCertificateEmail(certificateData: CertificateData): Promise<boolean> {
    try {
      console.log('Requesting certificate email for:', certificateData.donorEmail);
      
      // Call backend API to send certificate email
      const response = await fetch(`/api/certificates/${certificateData.certificateId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: certificateData.donorEmail,
          certificateData
        })
      });

      if (!response.ok) {
        throw new Error(`Email request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result.message);
      return result.success;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  static async sendSMSNotification(phoneNumber: string, certificateId: string, verificationUrl: string): Promise<boolean> {
    try {
      const message = `Dear Donor, your blood donation certificate ${certificateId} has been generated. Verify at: ${verificationUrl}. Thank you for saving lives! - Govt of India`;
      
      console.log('Sending SMS to:', phoneNumber);
      console.log('Message:', message);
      
      // In a real application, you would use a service like Twilio, AWS SNS, or an Indian SMS provider
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('SMS sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  private static generateEmailTemplate(certificateData: CertificateData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blood Donation Certificate</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .footer {
            background: #374151;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 14px;
        }
        .certificate-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
        }
        .button {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
        }
        .qr-section {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🩸 Blood Donation Certificate</h1>
        <p>Government of India</p>
    </div>
    
    <div class="content">
        <h2>Dear ${certificateData.donorName},</h2>
        
        <p>Congratulations! Your blood donation certificate has been successfully generated.</p>
        
        <div class="certificate-info">
            <h3>Certificate Details:</h3>
            <ul>
                <li><strong>Certificate ID:</strong> ${certificateData.certificateId}</li>
                <li><strong>Donation Date:</strong> ${certificateData.donationDate}</li>
                <li><strong>Blood Type:</strong> ${certificateData.bloodType}</li>
                <li><strong>Donation Center:</strong> ${certificateData.donationCenterName}</li>
                <li><strong>Location:</strong> ${certificateData.donationCenterAddress}</li>
            </ul>
        </div>
        
        <p>Your noble act of donating blood can save up to three lives. Thank you for being a life-saver!</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${certificateData.verificationUrl}" class="button">🔍 Verify Certificate Online</a>
            <a href="${certificateData.verificationUrl}" class="button">📄 Download Certificate</a>
        </div>
        
        <div class="qr-section">
            <p><strong>Quick Verification:</strong></p>
            <p>Scan the QR code in your certificate or visit:</p>
            <p><a href="${certificateData.verificationUrl}">${certificateData.verificationUrl}</a></p>
        </div>
        
        <h3>Important Information:</h3>
        <ul>
            <li>This certificate is digitally signed and can be verified online</li>
            <li>You can donate blood again after 3 months</li>
            <li>Keep yourself hydrated and take rest for the next 24 hours</li>
            <li>Contact us immediately if you experience any discomfort</li>
        </ul>
        
        <p><strong>रक्तदान महादान - आपका यह नेक कार्य किसी की जिंदगी बचा सकता है</strong></p>
        <p><em>Blood donation is the greatest donation - Your noble act can save someone's life</em></p>
    </div>
    
    <div class="footer">
        <p><strong>Contact Information:</strong></p>
        <p>📧 support@blooddonation.gov.in | 📞 Helpline: 1075</p>
        <p>🌐 Visit our website for more information about blood donation</p>
        <br>
        <p><small>This is an automated email. Please do not reply to this email.</small></p>
        <p><small>© ${new Date().getFullYear()} Government of India. All rights reserved.</small></p>
    </div>
</body>
</html>
    `;
  }

  static generatePlainTextTemplate(certificateData: CertificateData): string {
    return `
BLOOD DONATION CERTIFICATE
Government of India

Dear ${certificateData.donorName},

Congratulations! Your blood donation certificate has been successfully generated.

CERTIFICATE DETAILS:
- Certificate ID: ${certificateData.certificateId}
- Donation Date: ${certificateData.donationDate}
- Blood Type: ${certificateData.bloodType}
- Donation Center: ${certificateData.donationCenterName}
- Location: ${certificateData.donationCenterAddress}

Your noble act of donating blood can save up to three lives. Thank you for being a life-saver!

VERIFICATION:
You can verify this certificate online at: ${certificateData.verificationUrl}

IMPORTANT INFORMATION:
- This certificate is digitally signed and can be verified online
- You can donate blood again after 3 months
- Keep yourself hydrated and take rest for the next 24 hours
- Contact us immediately if you experience any discomfort

रक्तदान महादान - आपका यह नेक कार्य किसी की जिंदगी बचा सकता है
Blood donation is the greatest donation - Your noble act can save someone's life

CONTACT INFORMATION:
Email: support@blooddonation.gov.in
Helpline: 1075

© ${new Date().getFullYear()} Government of India. All rights reserved.
    `;
  }
}
