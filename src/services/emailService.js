/**
 * Email service - calls backend endpoint to send confirmation emails
 */

/**
 * Send application form submission confirmation email
 */
export const sendApplicationFormSubmissionEmail = async (formData, studentEmail) => {
  try {
    // Use environment variable for API URL (Vercel or local)
    const apiUrl = process.env.REACT_APP_EMAIL_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/email/application-form/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData,
        recipientEmail: studentEmail
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      console.warn('Email send failed:', result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

/**
 * Generic email sending function for any email type
 */
export const sendEmail = async (emailType, formData, recipientEmail) => {
  try {
    const apiUrl = process.env.REACT_APP_EMAIL_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: emailType,
        formData,
        recipientEmail
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      console.warn(`Email send failed (${emailType}):`, result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error(`Email send failed (${emailType}):`, error);
    return false;
  }
};

