import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CertificateData } from './certificateService';

export class PDFGenerator {
  static async generateCertificatePDF(certificateData: CertificateData): Promise<Blob> {
    // Create a temporary HTML element for the certificate
    const certificateElement = this.createCertificateHTML(certificateData);
    document.body.appendChild(certificateElement);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      return pdf.output('blob');
    } finally {
      // Clean up
      document.body.removeChild(certificateElement);
    }
  }

  private static createCertificateHTML(data: CertificateData): HTMLElement {
    const certificate = document.createElement('div');
    certificate.style.cssText = `
      width: 210mm;
      height: 297mm;
      padding: 20mm;
      font-family: 'Times New Roman', serif;
      background: white;
      box-sizing: border-box;
      position: fixed;
      top: -9999px;
      left: -9999px;
    `;

    certificate.innerHTML = `
      <div style="border: 3px solid #d97706; border-radius: 8px; padding: 30px; height: 100%; box-sizing: border-box; position: relative;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
            <img src="/api/placeholder/60/60" alt="Government of India Emblem" style="width: 60px; height: 60px;" />
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">भारत सरकार</h1>
              <h2 style="margin: 5px 0 0 0; font-size: 20px; color: #1f2937;">GOVERNMENT OF INDIA</h2>
            </div>
          </div>
          <h1 style="margin: 0; font-size: 26px; font-weight: bold; color: #dc2626; text-decoration: underline;">
            रक्तदान प्रमाणपत्र<br/>BLOOD DONATION CERTIFICATE
          </h1>
        </div>

        <!-- Certificate ID -->
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="font-size: 14px; font-weight: bold; background: #fef3c7; padding: 5px 15px; border: 1px solid #d97706; border-radius: 20px;">
            Certificate ID: ${data.certificateId}
          </span>
        </div>

        <!-- Main Content -->
        <div style="text-align: center; margin-bottom: 30px; line-height: 1.8;">
          <p style="font-size: 16px; margin: 10px 0;">
            यह प्रमाणित किया जाता है कि<br/>
            <strong>This is to certify that</strong>
          </p>
          
          <p style="font-size: 20px; font-weight: bold; color: #dc2626; margin: 15px 0; text-decoration: underline;">
            ${data.donorName}
          </p>
          
          <div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 14px;">
            <span><strong>Age / आयु:</strong> ${data.donorAge} years</span>
            <span><strong>Blood Group / रक्त समूह:</strong> ${data.bloodType}</span>
          </div>
          
          <p style="font-size: 16px; margin: 20px 0;">
            ने दिनांक <strong>${data.donationDate}</strong> को स्वेच्छा से रक्तदान किया है।<br/>
            <strong>has voluntarily donated blood on ${data.donationDate}.</strong>
          </p>
          
          <div style="margin: 25px 0; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #374151;">Donation Details / दान विवरण</h3>
            <div style="text-align: left; font-size: 14px; line-height: 1.6;">
              <p><strong>Donation Center / दान केंद्र:</strong> ${data.donationCenterName}</p>
              <p><strong>Address / पता:</strong> ${data.donationCenterAddress}</p>
              ${data.bloodUnitId ? `<p><strong>Blood Unit ID:</strong> ${data.bloodUnitId}</p>` : ''}
              <p><strong>Contact / संपर्क:</strong> ${data.donorPhone}</p>
            </div>
          </div>
          
          <p style="font-size: 14px; margin: 20px 0; font-style: italic; color: #6b7280;">
            रक्तदान महादान - आपका यह नेक कार्य किसी की जिंदगी बचा सकता है<br/>
            <em>Blood donation is the greatest donation - Your noble act can save someone's life</em>
          </p>
        </div>

        <!-- Footer Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
          <!-- QR Code -->
          <div style="text-align: center;">
            <img src="${data.qrCodeData}" alt="QR Code" style="width: 80px; height: 80px; border: 1px solid #e5e7eb;" />
            <p style="font-size: 10px; margin: 5px 0 0 0; color: #6b7280;">Scan to verify</p>
          </div>
          
          <!-- Signature -->
          <div style="text-align: center;">
            ${data.signatureImageUrl ? 
              `<img src="${data.signatureImageUrl}" alt="Signature" style="width: 120px; height: 60px; margin-bottom: 5px;" />` : 
              '<div style="width: 120px; height: 60px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>'
            }
            <p style="font-size: 12px; margin: 0; font-weight: bold;">${data.signatoryName}</p>
            <p style="font-size: 11px; margin: 2px 0 0 0; color: #6b7280;">${data.signatoryDesignation}</p>
          </div>
        </div>

        <!-- Footer Info -->
        <div style="position: absolute; bottom: 10px; left: 30px; right: 30px; text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          <p style="margin: 0;">
            Verify this certificate at: ${data.verificationUrl}<br/>
            For queries: support@blooddonation.gov.in | Helpline: 1075<br/>
            <em>This is a digitally generated certificate. No signature is required for validation.</em>
          </p>
        </div>
      </div>
    `;

    return certificate;
  }

  static async downloadPDF(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
