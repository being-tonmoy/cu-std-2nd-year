/**
 * CSV to Firebase Migration Script
 * 
 * This script reads the CSV file from public/students.csv and imports all records
 * into the Firestore 'eligible-students' collection.
 * 
 * Usage:
 *   node migrateCSVToFirebase.js
 * 
 * Requirements:
 *   - Firebase project setup with credentials
 *   - CSV file at: src/../public/students.csv
 */

const fs = require('fs');
const path = require('path');
// Note: In a browser environment, you need to mock or adjust these imports
// For Node.js backend, you would need to install Firebase Admin SDK

// Example for Node.js with Firebase Admin SDK:
// const admin = require('firebase-admin');
// const serviceAccount = require('./path-to-service-account-key.json');

// For Frontend Development - Use this workaround with Firebase REST API
const https = require('https');

/**
 * Parse CSV file and extract student records
 */
function parseCSV(csvFilePath) {
  try {
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n');
    const students = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const [student_id, name, subject, faculty] = line.split(',').map(v => v.trim());
      
      if (student_id) {
        students.push({
          student_id,
          name: name || '',
          subject: subject || '',
          faculty: faculty || ''
        });
      }
    }

    return students;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

/**
 * Add student to Firebase via REST API
 * This is an example using HTTP requests to Firestore
 */
function addStudentToFirebase(projectId, databaseId, studentData, accessToken) {
  return new Promise((resolve, reject) => {
    const documentId = studentData.student_id;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/eligible-students/${documentId}?updateMask.fieldPaths=student_id&updateMask.fieldPaths=name&updateMask.fieldPaths=subject&updateMask.fieldPaths=faculty`;

    const data = {
      name: `projects/${projectId}/databases/${databaseId}/documents/eligible-students/${documentId}`,
      fields: {
        student_id: { stringValue: studentData.student_id },
        name: { stringValue: studentData.name },
        subject: { stringValue: studentData.subject },
        faculty: { stringValue: studentData.faculty },
        addedAt: { timestampValue: new Date().toISOString() },
        updatedAt: { timestampValue: new Date().toISOString() }
      }
    };

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/${databaseId}/documents/eligible-students/${documentId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(data).length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, data: responseData });
        } else {
          reject(new Error(`Failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Main migration function
 * NOTE: This is a reference script. For production use:
 * 1. Use Firebase Admin SDK in a backend service
 * 2. Or use the browser-based StudentDataManager component to upload CSV
 */
async function migrateStudents() {
  // console.log('Starting CSV to Firebase migration...\n');

  // Determine CSV file path
  const csvFilePath = path.join(__dirname, '../public/students.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at: ${csvFilePath}`);
    // console.log('Please ensure the students.csv file exists in the public directory.');
    process.exit(1);
  }

  try {
    // Parse CSV
    // console.log(`Reading CSV file from: ${csvFilePath}`);
    const students = parseCSV(csvFilePath);
    // console.log(`Found ${students.length} student records.\n`);

    if (students.length === 0) {
      // console.log('No valid student records found in CSV.');
      process.exit(0);
    }

    // For production backend migration:
    // console.log('Migration Instructions:');
    // console.log('=======================\n');
    // console.log('Option 1: Use the Admin Interface (Recommended for Development)');
    // console.log('  1. Login to Admin Dashboard');
    // console.log('  2. Navigate to "Manage Students"');
    // console.log('  3. Click "Import CSV"');
    // console.log('  4. Select the students.csv file');
    // console.log('  5. Click "Yes, import" to import all records\n');

    // console.log('Option 2: Use Firebase Admin SDK (Backend)');
    // console.log('  1. Set up Firebase Admin SDK in your backend');
    // console.log('  2. Create a backend endpoint that calls importStudentsFromCSV()');
    // console.log('  3. Send the CSV data to that endpoint\n');

    // console.log('Option 3: Use Firestore Bulk Loader');
    // console.log('  1. Convert CSV to NDJSON format');
    // console.log('  2. Use Firebase CLI or Google Cloud tools\n');

    // Output sample data for verification
    // console.log('Sample records (first 5):');
    // console.log('========================');
    students.slice(0, 5).forEach((student, index) => {
      // console.log(`${index + 1}. ID: ${student.student_id}, Name: ${student.name}, Faculty: ${student.faculty}`);
    });
    if (students.length > 5) {
      // console.log(`... and ${students.length - 5} more records\n`);
    }

    // console.log('\nSuccess! CSV has been parsed.');
    // console.log(`Total records ready for import: ${students.length}`);
    // console.log('\nNext Step: Use the Admin Interface to import these records into Firebase.');

  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateStudents();
