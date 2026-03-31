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
  deleteDoc
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
 * Checks the form-values collection for existing submissions
 * @param {string} studentId - The student ID to check
 * @returns {Promise<boolean>} - True if submission exists, false otherwise
 */
export const checkDuplicateSubmission = async (studentId) => {
  try {
    // Query the form-values collection using collectionGroup
    const submissionsRef = collectionGroup(db, 'submissions');
    const q = query(submissionsRef, where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate submission:', error);
    // If there's an error, we'll allow the submission to proceed
    // This prevents the form from being completely blocked
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
    const { studentId, firstName, lastName, session, faculty, department, phoneNumber, email, aliasEmail, yearSemesterType, yearSemesterValue, agreeToTerms } = formData;

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