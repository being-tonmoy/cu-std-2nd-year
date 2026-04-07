import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  collectionGroup,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../utils/firebase';


/**
 * Create a new admin user
 */
export const createAdminUser = async (userData) => {
  try {
    const { email, password, name, role = 'admin' } = userData;
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const usersCollection = collection(db, 'admin-users');
    const userDoc = {
      email,
      password, // Store password as raw text (NOT HASHED)
      name,
      role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true
    };

    const docRef = doc(usersCollection, email);
    await setDoc(docRef, userDoc);

    return {
      success: true,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Authenticate admin user with email and password
 */
export const authenticateUser = async (email, password) => {
  try {
    const userDoc = await getUserByEmail(email);
    
    if (!userDoc) {
      return null;
    }

    if (!userDoc.isActive) {
      throw new Error('User account is disabled');
    }

    // Compare password directly (NOT HASHED)
    if (userDoc.password !== password) {
      return null;
    }

    return {
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      createdAt: userDoc.createdAt
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email) => {
  try {
    const usersCollection = collection(db, 'admin-users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Update admin user
 */
export const updateAdminUser = async (email, updateData) => {
  try {
    const usersCollection = collection(db, 'admin-users');
    const docRef = doc(usersCollection, email);

    const dataToUpdate = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    await updateDoc(docRef, dataToUpdate);

    return {
      success: true,
      message: 'User updated successfully'
    };
  } catch (error) {
    console.error('Error updating admin user:', error);
    throw error;
  }
};

/**
 * Delete admin user
 */
export const deleteAdminUser = async (email) => {
  try {
    const usersCollection = collection(db, 'admin-users');
    const docRef = doc(usersCollection, email);
    await deleteDoc(docRef);

    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting admin user:', error);
    throw error;
  }
};

/**
 * Get all admin users (superadmin only)
 */
export const getAllAdminUsers = async () => {
  try {
    const usersCollection = collection(db, 'admin-users');
    const querySnapshot = await getDocs(usersCollection);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        email: doc.id,
        ...doc.data()
      });
    });

    return users;
  } catch (error) {
    console.error('Error getting admin users:', error);
    throw error;
  }
};

/**
 * Check if a student ID already has a submission
 * Iterates through all faculties and departments to check if a document exists with the given studentId
 * @param {string} studentId - The student ID to check
 * @returns {Promise<boolean>} - True if submission exists, false otherwise
 */
export const checkDuplicateSubmission = async (studentId) => {
  try {
    // Get faculty data first
    const facultyData = await getFacultyData();
    
    if (!facultyData) {
      console.warn('No faculty data found, cannot check for duplicates');
      return false;
    }

    // Iterate through all faculties and their departments
    for (const [, facultyInfo] of Object.entries(facultyData)) {
      const facultyAlias = facultyInfo.alias;
      const departments = facultyInfo.departments || [];

      // Check each department in this faculty
      for (const department of departments) {
        const docPath = `student-information-form/form-values/${facultyAlias}/${department}/submissions/${studentId}`;
        const docRef = doc(db, docPath);
        const docSnapshot = await getDoc(docRef);

        // If document exists, a submission is already present
        if (docSnapshot.exists()) {
          return true;
        }
      }
    }

    // No submission found in any faculty/department
    return false;
  } catch (error) {
    console.error('Error checking duplicate submission:', error);
    // If there's an error, return false to allow submission
    // In production, consider logging this for monitoring
    return false;
  }
};

/**
 * Save student form data to Firestore
 * Structure:
 * - Collection: student-information-form
 *   - Document: form-values
 *     - Collection: {facultyAlias}
 *       - Collection: {departmentName}
 *         - Document: {studentId}
 *           - Form data
 */
export const saveStudentForm = async (formData, facultyData) => {
  try {
    const { studentId, firstName, lastName, session, faculty, department, degreeLevel, phoneNumber, email, aliasEmail, yearSemesterType, yearSemesterValue, agreeToTerms } = formData;

    // Convert faculty name to alias
    let facultyAlias = faculty;
    if (facultyData && typeof facultyData === 'object') {
      const facultyObj = Object.values(facultyData).find(f => f && f.name === faculty);
      if (facultyObj && facultyObj.alias) {
        facultyAlias = facultyObj.alias;
      }
    }

    // Create form data document
    const formDataDocument = {
      firstName,
      lastName,
      studentId,
      session,
      faculty, // Store full faculty name for display
      facultyAlias, // Store alias for reference
      department,
      degreeLevel: degreeLevel || 'Bachelor', // Default to Bachelor if not provided
      phoneNumber,
      email,
      aliasEmail,
      yearSemesterType,
      yearSemesterValue,
      agreeToTerms,
      isArchived: false, // Default to not archived
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Build path: student-information-form/form-values/{facultyAlias}/{department}/{studentId}
    const formValuesRef = doc(
      db,
      'student-information-form',
      'form-values'
    );

    const facultyCollRef = collection(formValuesRef, facultyAlias);
    const departmentDocRef = doc(facultyCollRef, department);
    const departmentCollRef = collection(departmentDocRef, 'submissions');
    const studentDocRef = doc(departmentCollRef, studentId);

    // Set the form data
    await setDoc(studentDocRef, formDataDocument);

    return {
      success: true,
      message: 'Form submitted successfully',
      documentId: studentId
    };
  } catch (error) {
    console.error('Error saving student form:', error);
    throw error;
  }
};

/**
 * Get student information by ID
 */
export const getStudentInfo = async (studentId, faculty, department) => {
  try {
    const formValuesRef = doc(db, 'student-information-form', 'form-values');
    const facultyCollRef = collection(formValuesRef, faculty);
    const departmentDocRef = doc(facultyCollRef, department);
    const departmentCollRef = collection(departmentDocRef, 'submissions');
    const studentDocRef = doc(departmentCollRef, studentId);

    const studentDoc = await getDoc(studentDocRef);

    if (studentDoc.exists()) {
      return {
        exists: true,
        data: studentDoc.data()
      };
    }
    return {
      exists: false,
      data: null
    };
  } catch (error) {
    console.error('Error getting student info:', error);
    throw error;
  }
};

/**
 * Get all submissions for a particular faculty and department
 */
export const getSubmissionsByFacultyDepartment = async (faculty, department) => {
  try {
    const formValuesRef = doc(db, 'student-information-form', 'form-values');
    const facultyCollRef = collection(formValuesRef, faculty);
    const departmentDocRef = doc(facultyCollRef, department);
    const departmentCollRef = collection(departmentDocRef, 'submissions');

    const querySnapshot = await getDocs(departmentCollRef);
    
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return submissions;
  } catch (error) {
    console.error('Error getting submissions:', error);
    throw error;
  }
};

/**
 * Initialize basic-info document for admin panel (if needed)
 */
export const initializeBasicInfo = async (adminData) => {
  try {
    const basicInfoRef = doc(db, 'student-information-form', 'basic-info');
    await setDoc(basicInfoRef, adminData, { merge: true });
    
    return {
      success: true,
      message: 'Basic info initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing basic info:', error);
    throw error;
  }
};

/**
 * Get basic-info document
 */
export const getBasicInfo = async () => {
  try {
    const basicInfoRef = doc(db, 'student-information-form', 'basic-info');
    const basicInfoDoc = await getDoc(basicInfoRef);

    if (basicInfoDoc.exists()) {
      return {
        exists: true,
        data: basicInfoDoc.data()
      };
    }
    return {
      exists: false,
      data: null
    };
  } catch (error) {
    console.error('Error getting basic info:', error);
    throw error;
  }
};

/**
 * Check if an alias email is available (not already used)
 * @param {string} aliasEmail - The alias email username to check (without @std.cu.ac.bd)
 * @returns {Promise<boolean>} - True if available, false if already taken
 */
export const checkAliasEmailAvailable = async (aliasEmail) => {
  try {
    // Query all submissions to check if this alias email already exists
    const q = query(collectionGroup(db, 'submissions'), where('aliasEmail', '==', aliasEmail));
    const querySnapshot = await getDocs(q);
    
    // If query returns results, the alias email is taken (not available)
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking alias email availability:', error);
    throw error;
  }
};

/**
 * Save faculty and department data to basic-info
 * @param {object} facultyData - Object with faculty aliases as keys
 * Example:
 * {
 *   fah: { name: "Faculty of Arts and Humanities", alias: "fah", departments: [...], createdAt: timestamp },
 *   fsc: { name: "Faculty of Science", alias: "fsc", departments: [...], createdAt: timestamp }
 * }
 */
export const saveFacultyData = async (facultyData) => {
  try {
    const basicInfoRef = doc(db, 'student-information-form', 'basic-info');
    
    // Add server timestamp to the entire document
    const dataToSave = {
      faculties: facultyData,
      updatedAt: Timestamp.now(),
      totalFaculties: Object.keys(facultyData).length,
      totalDepartments: Object.values(facultyData).reduce((sum, f) => sum + f.departments.length, 0)
    };

    await setDoc(basicInfoRef, dataToSave, { merge: true });

    return {
      success: true,
      message: 'Faculty data saved successfully'
    };
  } catch (error) {
    console.error('Error saving faculty data:', error);
    throw error;
  }
};

/**
 * Get faculty and department data from basic-info
 * @returns {Promise<object|null>} - Faculty data object or null if not found
 */
export const getFacultyData = async () => {
  try {
    const basicInfoRef = doc(db, 'student-information-form', 'basic-info');
    const basicInfoDoc = await getDoc(basicInfoRef);

    if (basicInfoDoc.exists()) {
      const data = basicInfoDoc.data();
      return data.faculties || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting faculty data:', error);
    throw error;
  }
};

/**
 * Get submission statistics
 */
export const getSubmissionStats = async () => {
  try {
    let totalSubmissions = 0;
    const submissionsByFaculty = {};

    // This is a simplified approach - in production, use aggregation queries
    const facultyData = await getFacultyData();
    
    if (facultyData) {
      for (const [, facultyInfo] of Object.entries(facultyData)) {
        const facultyName = facultyInfo.name;
        submissionsByFaculty[facultyName] = 0;

        // Get submissions for this faculty
        try {
          const facultyRef = doc(db, 'student-information-form', 'form-values', facultyName);
          const departmentsSnapshot = await getDocs(collection(facultyRef, 'departments'));

          for (const deptDoc of departmentsSnapshot.docs) {
            const submissionsSnapshot = await getDocs(
              collection(db, 'student-information-form', 'form-values', facultyName, deptDoc.id, 'submissions')
            );
            submissionsByFaculty[facultyName] += submissionsSnapshot.size;
            totalSubmissions += submissionsSnapshot.size;
          }
        } catch (e) {
          // Handle missing departments
        }
      }
    }

    return {
      totalSubmissions,
      submissionsByFaculty
    };
  } catch (error) {
    console.error('Error getting submission stats:', error);
    return {
      totalSubmissions: 0,
      submissionsByFaculty: {}
    };
  }
};

/**
 * Get all submissions across all faculties
 */
export const getAllSubmissions = async () => {
  try {
    const submissions = [];
    const q = query(collectionGroup(db, 'submissions'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt descending
    submissions.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));

    return submissions;
  } catch (error) {
    console.error('Error getting all submissions:', error);
    throw error;
  }
};

/**
 * Delete a student submission
 */
export const deleteStudentSubmission = async (studentId, faculty, department) => {
  try {
    // faculty could be either full name or alias, we store facultyAlias in the form data
    // Use the facultyAlias which is already stored in the submission
    const submissionPath = `student-information-form/form-values/${faculty}/${department}/submissions/${studentId}`;
    const docRef = doc(db, submissionPath);
    await deleteDoc(docRef);

    return {
      success: true,
      message: 'Submission deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw error;
  }
};

/**
 * Update student submission data
 * @param {string} studentId - The student ID
 * @param {string} faculty - The faculty name
 * @param {string} department - The department name
 * @param {object} updateData - The data to update
 */
export const updateSubmission = async (studentId, faculty, department, updateData) => {
  try {
    const submissionPath = `student-information-form/form-values/${faculty}/${department}/submissions/${studentId}`;
    const docRef = doc(db, submissionPath);
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Submission updated successfully'
    };
  } catch (error) {
    console.error('Error updating submission:', error);
    throw error;
  }
};
/**
 * Get all complaints for a specific student
 */
export const getComplaintsByStudentId = async (studentId) => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const q = query(
      complaintsRef,
      where('studentId', '==', studentId)
    );
    
    const snapshot = await getDocs(q);
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return complaints;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

/**
 * Get a specific complaint by ID
 */
export const getComplaintById = async (complaintId) => {
  try {
    const complaintDoc = await getDoc(doc(db, 'complaints', complaintId));
    
    if (complaintDoc.exists()) {
      return {
        id: complaintDoc.id,
        ...complaintDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching complaint:', error);
    throw error;
  }
};

/**
 * Add a message to a complaint
 */
export const addMessageToComplaint = async (complaintId, message, sentBy = 'student') => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    
    const newMessage = {
      text: message,
      sentBy: sentBy,
      timestamp: serverTimestamp(),
      isAdmin: sentBy === 'admin'
    };

    // Update complaint with new message and metadata
    await updateDoc(complaintRef, {
      messages: [...(await getComplaintById(complaintId)).messages, newMessage],
      lastUpdatedAt: serverTimestamp(),
      lastTextBy: sentBy
    });

    return {
      success: true,
      message: 'Message added successfully'
    };
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

/**
 * Update complaint status
 */
export const updateComplaintStatus = async (complaintId, status) => {
  try {
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const complaintRef = doc(db, 'complaints', complaintId);
    await updateDoc(complaintRef, {
      status: status,
      lastUpdatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Complaint status updated successfully'
    };
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};

/**
 * Get maintenance mode status from basic-info
 * @returns {Promise<boolean>} - True if maintenance mode is enabled, false otherwise
 */
export const getMaintenanceStatus = async () => {
  try {
    const basicInfoRef = doc(db, 'student-information-form', 'basic-info');
    const basicInfoDoc = await getDoc(basicInfoRef);

    if (basicInfoDoc.exists()) {
      const data = basicInfoDoc.data();
      return data.maintenanceMode || false;
    }
    return false;
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    return false;
  }
};

// ==================== STUDENT DATA MANAGEMENT ====================

/**
 * Add or update a student record in the eligible-students collection
 * Each student ID is stored as a separate document for easy lookup
 * @param {object} studentData - Student data with fields: student_id, name, subject, faculty
 */
export const addStudentData = async (studentData) => {
  try {
    const { student_id, name, subject, faculty } = studentData;
    
    if (!student_id) {
      throw new Error('student_id is required');
    }

    const studentsRef = collection(db, 'eligible-students');
    const docRef = doc(studentsRef, student_id);

    const dataToSave = {
      student_id,
      name: name || '',
      subject: subject || '',
      faculty: faculty || '',
      addedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(docRef, dataToSave, { merge: true });

    return {
      success: true,
      message: 'Student data saved successfully'
    };
  } catch (error) {
    console.error('Error adding student data:', error);
    throw error;
  }
};

/**
 * Check if a student ID exists in the eligible-students collection
 * @param {string} studentId - The student ID to check
 * @returns {Promise<boolean>} - True if student exists, false otherwise
 */
export const checkStudentExists = async (studentId) => {
  try {
    const studentRef = doc(db, 'eligible-students', studentId);
    const studentDoc = await getDoc(studentRef);
    return studentDoc.exists();
  } catch (error) {
    console.error('Error checking student existence:', error);
    // Return true on error to be lenient (allow submission if check fails)
    return true;
  }
};

/**
 * Get student data by ID
 * @param {string} studentId - The student ID
 * @returns {Promise<object|null>} - Student data or null if not found
 */
export const getStudentData = async (studentId) => {
  try {
    const studentRef = doc(db, 'eligible-students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (studentDoc.exists()) {
      return {
        id: studentDoc.id,
        ...studentDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting student data:', error);
    throw error;
  }
};

/**
 * Get all eligible students
 * @returns {Promise<array>} - Array of student records
 */
export const getAllStudents = async () => {
  try {
    const studentsRef = collection(db, 'eligible-students');
    const querySnapshot = await getDocs(studentsRef);
    
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by student_id
    students.sort((a, b) => a.student_id.localeCompare(b.student_id));
    
    return students;
  } catch (error) {
    console.error('Error getting all students:', error);
    throw error;
  }
};

/**
 * Update student data
 * @param {string} studentId - The student ID
 * @param {object} updateData - The data to update
 */
export const updateStudentData = async (studentId, updateData) => {
  try {
    const studentRef = doc(db, 'eligible-students', studentId);
    
    const dataToUpdate = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    await updateDoc(studentRef, dataToUpdate);

    return {
      success: true,
      message: 'Student data updated successfully'
    };
  } catch (error) {
    console.error('Error updating student data:', error);
    throw error;
  }
};

/**
 * Delete student data
 * @param {string} studentId - The student ID to delete
 */
export const deleteStudentData = async (studentId) => {
  try {
    const studentRef = doc(db, 'eligible-students', studentId);
    await deleteDoc(studentRef);

    return {
      success: true,
      message: 'Student data deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting student data:', error);
    throw error;
  }
};

/**
 * Batch import students from CSV data
 * @param {array} csvData - Array of student objects with: student_id, name, subject, faculty
 * @returns {Promise<object>} - Import statistics
 */
export const importStudentsFromCSV = async (csvData) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const studentData of csvData) {
      try {
        await addStudentData(studentData);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          studentId: studentData.student_id,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: `Import completed: ${successCount} successful, ${errorCount} failed`,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Error importing students:', error);
    throw error;
  }
};

/**
 * Improved batch import students from CSV - only uploads new documents (no duplicates)
 * Processes in batches of 500 rows to avoid network/quota issues
 * 
 * @param {array} csvData - Array of student objects: {student_id, name, subject, faculty}
 * @param {Function} onProgress - Optional callback for progress updates. Called with {current, total, message}
 * @returns {Promise<object>} - Import statistics with skipped count
 * 
 * @example
 * const result = await importStudentsFromCSVBatched(csvData, (progress) => {
 *   console.log(`${progress.current}/${progress.total}: ${progress.message}`);
 * });
 */
export const importStudentsFromCSVBatched = async (csvData, onProgress = null) => {
  try {
    const BATCH_SIZE = 500;
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Step 1: Get all existing student IDs to verify which ones need to be uploaded
    const reportProgress = (message) => {
      if (onProgress) {
        onProgress({
          current: successCount + skippedCount + errorCount,
          total: csvData.length,
          message
        });
      }
    };

    reportProgress('Checking for existing students...');
    const studentsRef = collection(db, 'eligible-students');
    const existingSnapshot = await getDocs(studentsRef);
    const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
    
    // Step 2: Filter out students that already exist
    const newStudents = csvData.filter(student => {
      if (existingIds.has(student.student_id)) {
        skippedCount++;
        return false;
      }
      return true;
    });

    reportProgress(`Found ${skippedCount} existing students. Will import ${newStudents.length} new students...`);

    // Step 3: Process in batches of 500
    for (let i = 0; i < newStudents.length; i += BATCH_SIZE) {
      const batch = newStudents.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(newStudents.length / BATCH_SIZE);

      reportProgress(`Uploading batch ${batchNumber}/${totalBatches} (${batch.length} students)...`);

      // Use writeBatch for efficient atomic writes
      const writeBatchRef = writeBatch(db);

      for (const studentData of batch) {
        try {
          const { student_id, name, subject, faculty } = studentData;
          
          if (!student_id) {
            throw new Error('student_id is required');
          }

          const docRef = doc(studentsRef, student_id);
          const dataToSave = {
            student_id,
            name: name || '',
            subject: subject || '',
            faculty: faculty || '',
            addedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          writeBatchRef.set(docRef, dataToSave);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            studentId: studentData.student_id,
            error: error.message
          });
        }
      }

      // Commit the batch
      await writeBatchRef.commit();

      // Add delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < newStudents.length) {
        reportProgress(`Batch ${batchNumber} uploaded. Waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    reportProgress('Import completed!');

    return {
      success: true,
      message: `Import completed: ${successCount} new students added, ${skippedCount} skipped (already exist), ${errorCount} failed`,
      successCount,
      skippedCount,
      errorCount,
      total: csvData.length,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Error importing students:', error);
    throw error;
  }
};

/**
 * Update maintenance mode status in basic-info
 * @param {boolean} isEnabled - True to enable maintenance mode, false to disable
 * @returns {Promise<object>} - Success/failure response
 */
export const updateMaintenanceStatus = async (isEnabled) => {
  try {
    const basicInfoRef = doc(db, 'student-information-form', 'basic-info');
    
    const dataToSave = {
      maintenanceMode: isEnabled,
      maintenanceModeUpdatedAt: Timestamp.now(),
      maintenanceModeUpdatedBy: 'superadmin'
    };

    await setDoc(basicInfoRef, dataToSave, { merge: true });

    return {
      success: true,
      message: isEnabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
    };
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    throw error;
  }
};