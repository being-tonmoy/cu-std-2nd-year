# Student Information Form - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Data Storage & Database Schema](#data-storage--database-schema)
5. [Component Architecture](#component-architecture)
6. [Data Flow](#data-flow)
7. [Form Fields & Validation](#form-fields--validation)
8. [Features](#features)
9. [Setup Instructions](#setup-instructions)
10. [Environment Variables](#environment-variables)

---

## Project Overview

The Student Information Form is a React-based web application for the University of Chittagong (2024-2025 Session) designed to collect student information during registration. The application supports:

- **Bilingual Interface**: English and Bangla (Bengali) language support
- **Institutional Email Provisioning**: Automatic alias email assignment (@std.cu.ac.bd)
- **Real-time Validation**: Duplicate check, email availability verification
- **Cloud Database Integration**: Firebase Firestore for data persistence
- **Responsive Design**: Mobile-first approach with Material-UI components
- **Professional UI**: University branding with custom styling

**Target Users**: University of Chittagong students registering for 2024-2025 session

---

## Project Structure

```
student-information-form/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── robots.txt
│   └── BigCircularLogo.jpg          # University logo (70x70px circular)
│
├── src/
│   ├── components/
│   │   ├── Header.js                # Top header with logo, title, language toggle
│   │   ├── BackgroundDesign.js      # SVG decorative background
│   │   ├── StudentForm.js           # Main form container component
│   │   └── StudentForm/             # Modularized form sub-components
│   │       ├── PersonalInformation.js
│   │       ├── AcademicInformation.js
│   │       └── TermsAndConditions.js
│   │
│   ├── contexts/
│   │   └── LanguageContext.js       # Bilingual translation system (40+ keys)
│   │
│   ├── hooks/
│   │   └── useLanguage.js           # Custom hook for language context
│   │
│   ├── pages/
│   │   ├── Home.js                  # Home page (currently empty)
│   │   └── FormPage.js              # Form page wrapper
│   │
│   ├── services/
│   │   └── firestoreService.js      # Database operations (CRUD)
│   │
│   ├── utils/
│   │   ├── firebase.js              # Firebase initialization
│   │   └── validation.js            # Form validation utilities
│   │
│   ├── App.js                       # React Router setup
│   ├── App.css                      # App-level styles
│   ├── App.test.js
│   ├── index.js                     # Entry point
│   ├── index.css                    # Global styles (Tailwind + custom)
│   ├── reportWebVitals.js
│   └── setupTests.js
│
├── .env                             # Firebase configuration (NOT in git)
├── .env.example                     # Template for .env
├── package.json                     # Dependencies & scripts
├── README.md                        # Project readme
├── tailwind.config.js               # Tailwind CSS configuration
├── DOCUMENTATION.md                 # This file
└── node_modules/                    # Dependencies (auto-generated)
```

---

## Technology Stack

### Frontend
- **React**: 19.2.3 (UI library)
- **React Router DOM**: 7.0.4 (Routing)
- **React Helmet Async**: 2.0.5 (Meta tags management)
- **Material-UI (MUI)**: 7.3.6 (Component library)
- **Tailwind CSS**: 3.4.19 (Utility-first styling)
- **SweetAlert2**: 11.26.17 (Modal alerts)

### Backend & Database
- **Firebase**: 12.7.0
  - **Firestore**: NoSQL cloud database
  - **Analytics**: (optional, currently disabled)

### Build Tools
- **Create React App** (CRA)
- **Node.js** & **npm** (Package management)

### Styling
- Material-UI components
- Tailwind CSS utilities
- Custom CSS for brand colors

---

## Data Storage & Database Schema

### Firestore Structure

```
Firestore Root
│
└── student-information-form/ (Collection)
    ├── basic-info (Document)
    │   └── Admin configuration data (session, faculties, etc.)
    │
    └── form-values (Document)
        ├── Science (Collection - Faculty Name)
        │   ├── Physics (Document - Department Name)
        │   │   └── submissions (Sub-collection)
        │   │       ├── 12345 (Document - Student ID)
        │   │       ├── 12346
        │   │       └── ...
        │   ├── Chemistry
        │   │   └── submissions
        │   │       └── ...
        │   └── ...
        │
        ├── Engineering (Collection - Faculty Name)
        │   ├── Civil Engineering
        │   │   └── submissions
        │   │       └── ...
        │   └── ...
        │
        ├── Arts
        ├── Business Studies
        ├── Law
        └── Medicine
```

### Document Schema

#### Form Submission Document
**Path**: `student-information-form/form-values/{faculty}/{department}/submissions/{studentId}`

```javascript
{
  // Personal Information
  firstName: "String",                    // First name (required)
  lastName: "String",                     // Last name (required)
  studentId: "String",                    // Student ID (unique, numeric)
  phoneNumber: "String",                  // 10-11 digits only
  email: "String",                        // Primary email (non-institutional)
  aliasEmail: "String",                   // Institutional email username (without @std.cu.ac.bd)
  
  // Academic Information
  session: "String",                      // e.g., "2024-25"
  faculty: "String",                      // Faculty name
  department: "String",                   // Department name
  yearSemesterType: "String",             // "year" or "semester"
  yearSemesterValue: "String",            // e.g., "1st", "2nd", "3rd"
  
  // Terms & Conditions
  agreeToTerms: "Boolean",                // Must be true
  
  // Metadata
  createdAt: "Timestamp",                 // Server timestamp (auto-generated)
  updatedAt: "Timestamp"                  // Server timestamp (auto-generated)
}
```

### Basic Info Document
**Path**: `student-information-form/basic-info`

```javascript
{
  // Admin configuration (used by admin panel later)
  session: "String",                      // Current session
  startDate: "Timestamp",                 // Registration start date
  endDate: "Timestamp",                   // Registration end date
  totalSubmissions: "Number",             // Count of submissions
  activeStatus: "Boolean"                 // Form open/closed status
}
```

---

## Component Architecture

### 1. **Header Component** (`src/components/Header.js`)
**Purpose**: Display university branding and language toggle

**Props**: None (uses language context directly)

**Features**:
- University logo (BigCircularLogo.jpg)
- Form title
- Language toggle button (EN/বাংলা)
- Gradient blue background (#001f3f to #003d7a)
- Responsive sizing

---

### 2. **BackgroundDesign Component** (`src/components/BackgroundDesign.js`)
**Purpose**: Decorative SVG background

**Features**:
- Fixed position background
- Gradient fills
- Animated SVG circles and curves
- University brand colors
- Responsive opacity

---

### 3. **StudentForm Component** (`src/components/StudentForm.js`)
**Purpose**: Main form container and state management

**State Management**:
```javascript
{
  formData: {
    firstName, lastName, studentId, phoneNumber, email, aliasEmail,
    session, faculty, department, yearSemesterType, yearSemesterValue,
    agreeToTerms
  },
  errors: {},                           // Field-specific error messages
  loading: false,                       // Form submission loading state
  checkingSubmission: false,            // Duplicate ID checking state
  checkingAlias: false,                 // Alias email availability checking
  submissionExists: null,               // Duplicate submission status
  aliasEmailAvailable: null,            // Alias email availability (true/false/null)
  departments: []                       // Dynamic department list
}
```

**Key Methods**:
- `handleInputChange()`: Update form data
- `handleCheckboxChange()`: Update checkbox fields
- `validateForm()`: Comprehensive form validation
- `handleSubmit()`: Submit form to Firestore
- `handleReset()`: Clear form with confirmation

**useEffect Hooks**:
- Monitor faculty changes → update departments
- Monitor student ID → check for duplicates
- Monitor alias email → check availability

---

### 4. **PersonalInformation Component** (`src/components/StudentForm/PersonalInformation.js`)
**Purpose**: Collect personal and contact information

**Fields**:
- First Name & Last Name (side-by-side on md+, stacked on xs)
- Student ID & Phone Number (side-by-side on md+, stacked on xs)
- Primary Email (full width with warning alert)
- Alias Email (with @std.cu.ac.bd suffix, availability indicator)

**Props**:
```javascript
{
  t,                          // Translation function
  language,                   // Current language ('en' or 'bn')
  formData,                   // Form state object
  errors,                     // Error messages object
  loading,                    // Loading state
  checkingSubmission,         // ID checking state
  onInputChange,              // Input change callback
  aliasEmailAvailable,        // Availability status (true/false/null)
  checkingAlias               // Alias checking state
}
```

---

### 5. **AcademicInformation Component** (`src/components/StudentForm/AcademicInformation.js`)
**Purpose**: Collect academic and enrollment information

**Fields**:
- Session & Faculty (side-by-side on md+, stacked on xs)
- Department (full width, dynamic based on faculty)
- Year/Semester Type (radio buttons: Year or Semester)
- Year/Semester Value (dropdown, aligned with radio buttons on md+)

**Props**:
```javascript
{
  t,              // Translation function
  language,       // Current language
  formData,       // Form state
  errors,         // Error messages
  loading,        // Loading state
  departments,    // Department list for selected faculty
  onInputChange   // Input change callback
}
```

**Faculty-Department Mapping**:
```javascript
{
  'Science': ['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'Geology'],
  'Engineering': ['Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Computer Science'],
  'Arts': ['English', 'Bengali', 'History', 'Philosophy', 'Economics'],
  'Business Studies': ['Accounting', 'Management', 'Marketing', 'Finance'],
  'Law': ['Common Law', 'Constitutional Law', 'Criminal Law'],
  'Medicine': ['General Medicine', 'Surgery', 'Pediatrics']
}
```

---

### 6. **TermsAndConditions Component** (`src/components/StudentForm/TermsAndConditions.js`)
**Purpose**: Display and collect agreement to institutional email terms

**Content**:
- Single checkbox: "I have read and understood that I will receive an institutional email from the University of Chittagong. If any information I provide is false or incorrect, the responsibility is solely mine."

**Props**:
```javascript
{
  t,                  // Translation function
  formData,           // Form state
  errors,             // Error messages
  loading,            // Loading state
  onCheckboxChange    // Checkbox change callback
}
```

---

## Data Flow

### User Registration Flow

```
1. User visits form page
   ↓
2. Header component renders with language toggle
3. BackgroundDesign renders decorative SVG
4. StudentForm loads with empty state
5. PersonalInformation component displays
   ↓
6. User enters personal data
   - realtime validation
   - Student ID → checkDuplicateSubmission() (Firestore query)
   - Alias Email → checkAliasEmailAvailable() (Firestore query)
   ↓
7. AcademicInformation component displays
8. User selects faculty → departments update dynamically
9. User selects year/semester type → dropdown options change
   ↓
10. TermsAndConditions component displays
11. User must check agreement
   ↓
12. User clicks Submit
   ↓
13. validateForm() checks all fields
14. If errors: SweetAlert error dialog
15. If valid: Proceed
   ↓
16. Final duplicate check (race condition prevention)
17. saveStudentForm() sends to Firestore
18. Document path: student-information-form/form-values/{faculty}/{department}/submissions/{studentId}
   ↓
19. SweetAlert success dialog
20. Form resets to empty state
```

### Data Flow Diagram

```
┌─────────────────┐
│  User Input     │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│  handleInputChange()     │
│  - Update formData       │
│  - Clear field errors    │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐  ┌──────────────────────┐
│ State  │  │ Validation Effects   │
│ Update │  │ - Check duplicates   │
└────────┘  │ - Check alias avail. │
            └──────────────────────┘
              ↓
           Firestore Query
              ↓
        Update Component UI
        (Show availability status)
```

---

## Form Fields & Validation

### Field Specifications

| Field | Type | Validation | Constraints |
|-------|------|-----------|-------------|
| **First Name** | Text | Required, max 100 chars | Must have content |
| **Last Name** | Text | Required, max 100 chars | Must have content |
| **Student ID** | Number | Required, unique, numeric | Only digits, must be unique in database |
| **Phone Number** | Phone | Required, 10-11 digits | No special characters except cleaned |
| **Primary Email** | Email | Required, valid email format | Standard email regex validation |
| **Alias Email** | Text | Required, alphanumeric + underscore, unique | No personal email patterns (gmail, yahoo, hotmail, outlook, mail, yandex, proton) |
| **Session** | Select | Required | Must select from list (2024-25, 2023-24, 2022-23) |
| **Faculty** | Select | Required | Must select valid faculty |
| **Department** | Select | Required | Dependent on faculty selection |
| **Year/Semester Type** | Radio | Required | Year or Semester |
| **Year/Semester Value** | Select | Required | Dependent on type selection |
| **Terms & Conditions** | Checkbox | Required | Must be checked (true) |

### Validation Functions (`src/utils/validation.js`)

```javascript
// Email validation
validateEmail(email: string): boolean
// Returns true if email matches pattern: xxx@xxx.xxx

// Student ID validation
validateStudentId(id: string): boolean
// Returns true if only numbers and length > 0

// Phone number validation
validatePhoneNumber(phone: string): boolean
// Returns true if 10-11 digits only

// Name validation
validateName(name: string): boolean
// Returns true if non-empty and length <= 100

// Alias email validation
validateAliasEmail(aliasEmail: string): boolean
// Returns true if:
// - Only alphanumeric, underscore, dot, hyphen
// - Length between 3-30
// - No blacklisted patterns (gmail, yahoo, hotmail, etc.)

// Phone number cleaning
cleanPhoneNumber(phone: string): string
// Removes all non-digit characters

// Form-wide validation
validateFormFields(formData: object): boolean
// Checks all required fields are present and valid
```

---

## Features

### 1. **Real-time Duplicate Checking**
- Checks Student ID against all submissions in Firestore
- Uses `collectionGroup()` query for cross-faculty search
- Shows loading spinner while checking
- Prevents form submission if duplicate exists

### 2. **Alias Email Availability**
- Checks if @std.cu.ac.bd alias is already taken
- Real-time availability feedback with colored icons
- Green checkmark (available)
- Red X (unavailable)
- Blue info icon (checking or no input)
- Shows helpful message if unavailable

### 3. **Bilingual Support**
- Complete English ↔ Bangla translation
- 40+ translation keys in LanguageContext
- Language toggle in header
- Persistent across all components

### 4. **Responsive Design**
- Mobile-first approach (xs: 320px+)
- Tablet breakpoint (sm: 640px+)
- Desktop breakpoint (md: 960px+)
- Large desktop breakpoint (lg: 1200px+)
- Form fields stack on mobile, align in rows on desktop

### 5. **Input Sanitization**
- Student ID: Only digits allowed
- Phone Number: Automatically cleaned (non-digits removed)
- Alias Email: Only alphanumeric + underscore/dot/hyphen

### 6. **Visual Feedback**
- Error messages on invalid fields (red)
- Helper text with contextual information
- Loading spinners during async operations
- Success/error alerts using SweetAlert2

### 7. **Security Features**
- Server-side timestamp on submissions
- Race condition prevention (double-check on submit)
- No sensitive data in local storage
- Firebase security rules (configured in Firebase Console)

---

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account with Firestore enabled

### Installation Steps

1. **Clone the repository**
```bash
cd student-information-form
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Add Firebase credentials to .env**
```
REACT_APP_API_KEY=your_api_key
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_APP_ID=your_app_id
REACT_APP_MEASUREMENT_ID=your_measurement_id
```

5. **Start the development server**
```bash
npm start
```

6. **Build for production**
```bash
npm run build
```

### Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Create the collection structure:
   - `student-information-form/basic-info`
   - `student-information-form/form-values/{faculty}/{department}/submissions`
4. Set up Firebase Security Rules (in Firebase Console):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads and writes to student-information-form collection
    match /student-information-form/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

(Note: Adjust rules based on your security requirements)

---

## Environment Variables

### `.env` Template

```
# Firebase Configuration
REACT_APP_API_KEY=your_firebase_api_key
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_firebase_project_id
REACT_APP_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_APP_ID=your_firebase_app_id
REACT_APP_MEASUREMENT_ID=your_measurement_id

# Optional: Application Settings
REACT_APP_ENVIRONMENT=development
```

**Note**: Never commit `.env` file to version control. Only `.env.example` should be in the repository.

---

## API/Service Functions

### Firestore Service (`src/services/firestoreService.js`)

#### `checkDuplicateSubmission(studentId: string): Promise<boolean>`
- **Purpose**: Check if student ID already has a submission
- **Returns**: `true` if exists, `false` if unique
- **Uses**: `collectionGroup()` query across all submissions

#### `saveStudentForm(formData: object): Promise<{success, message, documentId}>`
- **Purpose**: Save form data to Firestore
- **Path**: `student-information-form/form-values/{faculty}/{department}/submissions/{studentId}`
- **Adds**: Server timestamps (createdAt, updatedAt)

#### `checkAliasEmailAvailable(aliasEmail: string): Promise<boolean>`
- **Purpose**: Check if alias email username is available
- **Returns**: `true` if available, `false` if taken
- **Uses**: `collectionGroup()` query

#### `getStudentInfo(studentId: string, faculty: string, department: string): Promise<{exists, data}>`
- **Purpose**: Retrieve specific student record
- **Returns**: Student document data if exists

#### `getSubmissionsByFacultyDepartment(faculty: string, department: string): Promise<array>`
- **Purpose**: Get all submissions for a faculty-department pair
- **Returns**: Array of student documents

#### `getBasicInfo(): Promise<{exists, data}>`
- **Purpose**: Retrieve admin configuration
- **Returns**: Basic-info document data

---

## Color Scheme

### University of Chittagong Branding
- **Primary Dark Blue**: `#001f3f`
- **Secondary Blue**: `#003d7a`
- **Light Blue Gradient**: `#0066cc` to `#003d7a`

### Alert Colors
- **Error/Danger**: `#d32f2f` (red)
- **Success**: `#2e7d32` (green)
- **Warning**: `#f57c00` (orange)
- **Info**: `#0288d1` (light blue)

### Text Colors
- **Primary Text**: `#333333`
- **Secondary Text**: `#666666`
- **Disabled Text**: `#999999`

---

## Future Enhancements

1. **Admin Panel**: Nested route `/admin` for viewing submissions, filtering, exporting
2. **Email Notifications**: Send confirmation emails to submitted email addresses
3. **PDF Export**: Generate downloadable receipt/confirmation PDF
4. **Advanced Filtering**: Admin dashboard with faculty/department filtering
5. **Search & Pagination**: Browse and manage large submission volumes
6. **Dashboard Charts**: Visualize submission statistics and trends
7. **Multi-session Support**: Handle multiple registration sessions
8. **SMS Notifications**: Optional SMS alerts for confirmation

---

## Troubleshooting

### Common Issues

**Q: Form won't submit**
- A: Check Firebase credentials in `.env`
- Verify Firestore rules allow write access
- Check browser console for error messages

**Q: Duplicate check not working**
- A: Ensure `collectionGroup` index is created in Firestore
- Check that Student ID field exists in saved documents
- Verify Firestore read permissions

**Q: Alias email checking slow**
- A: Normal for first query (Firestore initializes)
- Subsequent checks will be faster
- Consider adding caching in future versions

**Q: Language toggle not working**
- A: Verify LanguageContext provider wraps entire app
- Check console for context errors
- Clear browser cache and reload

---

## Support & Contact

For issues or questions about the form:
- Contact: University of Chittagong IT Department
- Email: [registration@cu.ac.bd](mailto:registration@cu.ac.bd)
- Phone: [+880-31-726-01-09](tel:+880-31-726-01-09)

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Active
