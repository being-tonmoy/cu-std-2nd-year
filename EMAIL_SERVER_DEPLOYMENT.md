# Email Server - Deployment & API Documentation

Your application now uses a **scalable REST API email server** deployed on Vercel.

## 📋 Architecture

```
React App (localhost:3000 or deployed)
        ↓
Email API (Vercel)
        ↓
Nodemailer + Gmail SMTP
        ↓
Student Email
```

## 🚀 Quick Start

### Local Development

**Terminal 1 - Start Email Server:**
```bash
cd email-server
npm install
npm run dev
```
Runs on `http://localhost:3001`

**Terminal 2 - Start React App:**
```bash
npm install
npm start
```
Runs on `http://localhost:3000`

Form will automatically send emails to `http://localhost:3001/api/email/application-form/submit`

### Deploy to Vercel

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Add email server with REST API"
   git push
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Connect your Git repository
   - Root Directory: `email-server`
   - Environment Variables:
     - `EMAIL_USER` = `xxxxxxxxxx@xx.xx.xx.xx`
     - `EMAIL_PASSWORD` = `xxxx xxxx xxxx xxxx`
   - Deploy

3. **Get Vercel URL:** `https://email-server-xyz.vercel.app`

4. **Update Frontend `.env`:**
   ```env
   REACT_APP_EMAIL_API_URL=https://email-server-xyz.vercel.app
   ```

5. **Deploy Frontend** (same as before)

## 📡 API Endpoints

### 1. Health Check
```
GET /api/health
```
**Response:**
```json
{
  "success": true,
  "message": "Email server is running"
}
```

### 2. Application Form Submission
```
POST /api/email/application-form/submit
```
**Request body:**
```json
{
  "formData": {
    "firstName": "John",
    "lastName": "Doe",
    "studentId": "12345",
    "email": "john@example.com",
    "phoneNumber": "+880123456789",
    "session": "2023-2024",
    "faculty": "Science",
    "department": "CS",
    "degreeLevel": "Bachelor",
    "yearSemesterType": "year",
    "yearSemesterValue": "3",
    "aliasEmail": "john.doe"
  },
  "recipientEmail": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application form submission email sent successfully",
  "data": {
    "recipientEmail": "john@example.com",
    "studentId": "12345",
    "sentAt": "2026-04-05T10:30:00.000Z"
  }
}
```

### 3. Generic Email Endpoint
```
POST /api/email/send
```
For sending different email types.

**Request body:**
```json
{
  "type": "application-form-submission",
  "formData": { ...data },
  "recipientEmail": "recipient@example.com"
}
```

## 📝 Adding New Email Types

To add a new email type (e.g., "registration-confirmation"):

1. **Add template in `email-server/api/email.js`:**
```javascript
const registrationConfirmationTemplate = (userData) => {
  return `<html>...</html>`;
};
```

2. **Add handler:**
```javascript
const sendRegistrationConfirmation = async (userData, recipientEmail) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: 'Registration Confirmation',
    html: registrationConfirmationTemplate(userData)
  });
};
```

3. **Add to switch in `/api/email/send`:**
```javascript
case 'registration-confirmation':
  result = await sendRegistrationConfirmation(formData, recipientEmail);
  break;
```

4. **Use in frontend (`src/services/emailService.js`):**
```javascript
import { sendEmail } from '../services/emailService';

// Usage
await sendEmail('registration-confirmation', userData, emailAddress);
```

## 🎯 Using in Frontend

The frontend already imports from `emailService.js`:

```javascript
import { sendApplicationFormSubmissionEmail } from '../services/emailService';

// In form submission handler
await sendApplicationFormSubmissionEmail(formData, studentEmail);
```

Or use the generic function:
```javascript
import { sendEmail } from '../services/emailService';

await sendEmail('application-form-submission', formData, studentEmail);
```

## 📂 File Structure

```
project/
├── email-server/                    # REST API Email Server
│   ├── api/
│   │   └── email.js                # Email templates & handlers
│   ├── package.json
│   ├── vercel.json                 # Vercel config  
│   ├── .env.example
│   ├── .gitignore
│   └── README.md                   # API documentation
│
├── src/
│   ├── services/
│   │   └── emailService.js         # Frontend API caller
│   ├── components/
│   │   └── StudentForm.js          # Calls emailService
│   └── ...
│
├── .env                            # Frontend config
│   └── REACT_APP_EMAIL_API_URL=...
└── ...
```

## 🔧 Configuration

### Email Server (`.env`)
```env
EMAIL_USER=ict@cu.ac.bd
EMAIL_PASSWORD=ucui xflj auma rlww
PORT=3001  # Optional, default 3001
```

### Frontend (`.env`)
```env
# Local development
REACT_APP_EMAIL_API_URL=http://localhost:3001

# Production (after Vercel deployment)
REACT_APP_EMAIL_API_URL=https://email-server-xyz.vercel.app
```

## ✅ Testing

### Test Email Server Locally
```bash
# In email-server folder
npm run dev

# In another prompt
curl http://localhost:3001/api/health
```

### Test Form Submission
1. Fill form and submit
2. Check your email inbox
3. Check terminal/logs for errors

### Test After Vercel Deployment
1. Update `.env` with Vercel URL
2. Run `npm start`
3. Submit form
4. Check email

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check `.env` credentials, 2FA enabled on Gmail |
| CORS errors | Verify `REACT_APP_EMAIL_API_URL` is correct |
| 404 errors | Check endpoint path: `/api/email/application-form/submit` |
| Vercel deployment fails | Check `Root Directory` is set to `email-server` |
| Function timeout | Gmail connection might be slow, check logs |

## 💰 Cost & Limits

- **Vercel**: Free tier allows 100,000 invocations/month
- **Gmail**: 500 emails/day (usually sufficient)
- **Performance**: ~1-2 seconds per email

## 📚 More Info

See `email-server/README.md` for complete API documentation and more examples.

