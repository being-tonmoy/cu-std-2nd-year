# Email API Reference

Quick reference for the email server REST API endpoints.

## Base URL

**Local:** `http://localhost:3001`
**Production:** `https://email-server-xyz.vercel.app` (replace xyz with your URL)

## Endpoints

### GET /api/health
Health check endpoint.

**Request:**
```bash
curl http://localhost:3001/api/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email server is running",
  "timestamp": "2026-04-05T10:30:00.000Z"
}
```

---

### POST /api/email/application-form/submit
Send student application form submission confirmation email.

**Request:**
```bash
curl -X POST http://localhost:3001/api/email/application-form/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "firstName": "John",
      "lastName": "Doe",
      "studentId": "12345",
      "email": "john@example.com",
      "phoneNumber": "+880123456789",
      "session": "2023-2024",
      "faculty": "Science",
      "department": "Computer Science",
      "degreeLevel": "Bachelor",
      "yearSemesterType": "year",
      "yearSemesterValue": "3",
      "aliasEmail": "john.doe"
    },
    "recipientEmail": "john@example.com"
  }'
```

**Response (200 OK):**
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

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required fields: formData and recipientEmail"
}
```

**Error Response (500 Server Error):**
```json
{
  "success": false,
  "message": "Failed to send email",
  "error": "Connection timeout"
}
```

---

### POST /api/email/send
Generic email endpoint for any email type.

**Request:**
```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "application-form-submission",
    "formData": { ...data },
    "recipientEmail": "recipient@example.com"
  }'
```

**Request Body:**
```json
{
  "type": "application-form-submission",
  "formData": {
    "firstName": "John",
    "lastName": "Doe",
    "studentId": "12345",
    "email": "john@example.com",
    "phoneNumber": "+880123456789",
    "session": "2023-2024",
    "faculty": "Science",
    "department": "Computer Science",
    "degreeLevel": "Bachelor",
    "yearSemesterType": "year",
    "yearSemesterValue": "3",
    "aliasEmail": "john.doe"
  },
  "recipientEmail": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "application-form-submission email sent successfully",
  "data": {
    "type": "application-form-submission",
    "recipientEmail": "john@example.com",
    "sentAt": "2026-04-05T10:30:00.000Z"
  }
}
```

**Supported Types:**
- `application-form-submission`

---

## Frontend Usage

### Using emailService.js

```javascript
import { sendApplicationFormSubmissionEmail, sendEmail } from '../services/emailService';

// Method 1: Specific endpoint
await sendApplicationFormSubmissionEmail(formData, studentEmail);

// Method 2: Generic endpoint
await sendEmail('application-form-submission', formData, studentEmail);
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Email sent successfully |
| 400 | Bad request (missing fields, validation error) |
| 404 | Endpoint not found |
| 500 | Server error |

---

## Form Data Structure

```javascript
{
  firstName: string,        // Student's first name
  lastName: string,         // Student's last name
  studentId: string,        // Student ID (required)
  email: string,           // Student's email
  phoneNumber: string,     // Student's phone
  session: string,         // Academic session
  faculty: string,         // Faculty name
  department: string,      // Department name
  degreeLevel: string,     // Bachelor, Masters, M.Phil, PhD
  yearSemesterType: string,// 'year' or 'semester'
  yearSemesterValue: string,// '1', '2', '3', etc.
  aliasEmail: string       // University alias email
}
```

---

## Error Handling

All endpoints return a `success` boolean. Check this field to determine if the request succeeded.

```javascript
const response = await fetch(url, options);
const data = await response.json();

if (data.success) {
  // Email sent successfully
} else {
  // Handle error
  console.error(data.message);
}
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `Missing required fields` | Check all required fields in request body |
| `Unknown email type` | Check email type is supported |
| `Failed to send email` | Check Gmail credentials in environment variables |
| `Connection timeout` | Check internet connection and Gmail server status |

---

## Adding New Email Types

See `email-server/README.md` section "Extending with New Email Types" for detailed instructions.

Quick steps:
1. Add template function in `api/email.js`
2. Add handler function in `api/email.js`
3. Add case in switch statement in `/api/email/send`
4. Test with curl or frontend

---

## Testing with cURL

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Send Email
```bash
curl -X POST http://localhost:3001/api/email/application-form/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "firstName": "Test",
      "lastName": "User",
      "studentId": "123",
      "email": "test@example.com",
      "phoneNumber": "+880123456789",
      "session": "2023-2024",
      "faculty": "Science",
      "department": "CS",
      "degreeLevel": "Bachelor",
      "yearSemesterType": "year",
      "yearSemesterValue": "3",
      "aliasEmail": "test.user"
    },
    "recipientEmail": "your-email@gmail.com"
  }'
```

---

## Rate Limiting

No rate limiting is currently implemented. Vercel's free tier has:
- **100,000 function invocations/month**
- **1,000,000 requests per day** (more than enough for emails)

---

## Environment Variables

```env
EMAIL_USER=xxxxxxxxxxx@xx.xx.xx.xx              # Gmail address
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx   # Gmail app password
PORT=3001                            # Server port (optional)
NODE_ENV=production                  # Environment (optional)
```

---

## Latency

Average response times:
- Health check: <10ms
- Send email: 1-3 seconds (depends on Gmail)

---

For more information, see:
- `email-server/README.md` - Full documentation
- `EMAIL_SERVER_DEPLOYMENT.md` - Deployment guide
