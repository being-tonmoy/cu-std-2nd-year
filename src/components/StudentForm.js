import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Swal from 'sweetalert2';
import { useLanguage } from '../hooks/useLanguage';
import { 
  validateEmail, 
  validateStudentId, 
  validatePhoneNumber, 
  validateName,
  cleanPhoneNumber,
  validateAliasEmailWithError,
  checkStudentIdInCSV
} from '../utils/validation';
import { 
  checkDuplicateSubmission,
  checkEligibleStudent,
  validateEligibleStudentInfo,
  checkDuplicateSubmissionOptimized,
  saveStudentForm,
  getFacultyData,
  getMaintenanceStatus
} from '../services/firestoreService';
import { sendApplicationFormSubmissionEmail } from '../services/emailService';
import PersonalInformation from './StudentForm/PersonalInformation';
import AcademicInformation from './StudentForm/AcademicInformation';
import TermsAndConditions from './StudentForm/TermsAndConditions';
import MaintenancePage from './MaintenancePage';

const StudentForm = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    session: '',
    faculty: '',
    department: '',
    degreeLevel: 'Bachelor',
    phoneNumber: '',
    email: '',
    aliasEmail: '',
    yearSemesterType: 'year',
    yearSemesterValue: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submissionExists, setSubmissionExists] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [facultyData, setFacultyData] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  // Load faculty data and check maintenance status on component mount
  useEffect(() => {
    loadFacultyDataFromFirestore();
    checkMaintenanceStatus();
    preloadStudentCSV(); // Preload CSV in background while student fills form
  }, []);

  // Preload the CSV file in the background so it's ready when user submits
  const preloadStudentCSV = async () => {
    try {
      const response = await fetch('/students.csv');
      if (response.ok) {
        // console.log('CSV preloaded successfully');
      }
    } catch (error) {
      console.error('Error preloading CSV:', error);
      // Silent fail - doesn't affect form functionality
    }
  };

  const checkMaintenanceStatus = async () => {
    try {
      setLoadingMaintenance(true);
      const status = await getMaintenanceStatus();
      setMaintenanceMode(status);
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const loadFacultyDataFromFirestore = async () => {
    try {
      const data = await getFacultyData();
      if (data) {
        setFacultyData(data);
      } else {
        console.warn('No faculty data found in Firestore');
      }
    } catch (error) {
      console.error('Error loading faculty data:', error);
    }
  };

  // Update departments when faculty changes
  useEffect(() => {
    if (formData.faculty && facultyData) {
      // Find the faculty object and get its departments
      const selectedFacultyObj = Object.values(facultyData).find(f => f && f.name === formData.faculty);
      if (selectedFacultyObj && selectedFacultyObj.departments) {
        setDepartments(selectedFacultyObj.departments);
      } else {
        setDepartments([]);
      }
      // Clear department when faculty changes
      setFormData(prev => ({ ...prev, department: '' }));
    } else {
      setDepartments([]);
    }
  }, [formData.faculty, facultyData]);

  const handleInputChange = useCallback((e, value) => {
    // Handle RadioGroup onChange (Material-UI RadioGroup passes value as second parameter)
    let name, finalValue;
    
    if (value !== undefined) {
      // This is from RadioGroup which passes (event, newValue)
      name = e.target.name;
      finalValue = value;
    } else {
      // Standard input/select onChange
      const { name: fieldName, value: fieldValue } = e.target;
      name = fieldName;
      finalValue = fieldValue;
    }

    // Special handling for phone number - clean it
    if (name === 'phoneNumber') {
      finalValue = cleanPhoneNumber(finalValue);
    }

    // Special handling for student ID - only allow numbers
    if (name === 'studentId') {
      finalValue = finalValue.replace(/\D/g, '');
    }

    // Special handling for alias email - only allow alphanumeric and dots/hyphens
    if (name === 'aliasEmail') {
      finalValue = finalValue.replace(/[^a-zA-Z0-9.-]/g, '').toLowerCase();
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear error for this field if it exists
    setErrors(prev => {
      if (prev[name]) {
        return {
          ...prev,
          [name]: ''
        };
      }
      return prev;
    });
  }, []);

  const handleCheckboxChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    setErrors(prev => {
      if (prev[name]) {
        return {
          ...prev,
          [name]: ''
        };
      }
      return prev;
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Validate first name
    if (!validateName(formData.firstName)) {
      newErrors.firstName = t('required');
    }

    // Validate last name
    if (!validateName(formData.lastName)) {
      newErrors.lastName = t('required');
    }

    // Validate student ID
    if (!validateStudentId(formData.studentId)) {
      newErrors.studentId = language === 'en' 
        ? 'Student ID must be either 8 or 10 digits'
        : 'শিক্ষার্থী আইডি ৮ বা ১০ অঙ্কের হতে হবে';
    }

    // Check for duplicate
    if (submissionExists) {
      newErrors.studentId = t('duplicateId');
    }

    // Validate other required fields
    if (!formData.session) {
      newErrors.session = t('required');
    }

    if (!formData.faculty) {
      newErrors.faculty = t('required');
    }

    if (!formData.department) {
      newErrors.department = t('required');
    }

    // Validate degree level
    if (!formData.degreeLevel) {
      newErrors.degreeLevel = t('required');
    }

    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = t('invalidPhone');
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    // Validate alias email format with specific error message
    const aliasValidation = validateAliasEmailWithError(formData.aliasEmail, formData.studentId, language);
    if (!aliasValidation.valid) {
      newErrors.aliasEmail = aliasValidation.error;
    }

    // Validate year/semester
    if (!formData.yearSemesterValue) {
      newErrors.yearSemesterValue = t('required');
    }

    // Validate terms and conditions
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // STEP 1: VALIDATE FORM FIELDS FIRST
    if (!validateForm()) {
      // Get field names with errors
      const errorFields = Object.keys(errors).filter(key => errors[key]);
      const fieldLabels = {
        firstName: 'First Name',
        lastName: 'Last Name',
        studentId: 'Student ID',
        session: 'Session',
        faculty: 'Faculty',
        department: 'Department',
        degreeLevel: 'Degree Level',
        phoneNumber: 'Phone Number',
        email: 'Email',
        aliasEmail: 'Alias Email',
        yearSemesterValue: 'Year/Semester',
        agreeToTerms: 'Terms and Conditions'
      };
      
      // Build detailed error message with specific error details
      let errorMessage = '';
      if (errorFields.length > 0) {
        errorMessage = errorFields.map(f => {
          const label = fieldLabels[f] || f;
          const detail = errors[f];
          return `<strong>${label}:</strong> ${detail}`;
        }).join('<br/><br/>');
      } else {
        errorMessage = 'Please correct the errors in the form';
      }

      Swal.fire({
        icon: 'error',
        title: language === 'en' ? 'Validation Error' : 'বৈধতা ত্রুটি',
        html: language === 'en' ? errorMessage : 'ফর্মের ত্রুটিগুলি সংশোধন করুন',
        confirmButtonColor: '#001f3f'
      });
      return;
    }

    // STEP 2: CHECK IF STUDENT IS ELIGIBLE (1 database read)
    setLoading(true);
    try {
      const isEligible = await checkEligibleStudent(formData.studentId);
      if (!isEligible) {
        Swal.fire({
          icon: 'error',
          title: language === 'en' ? 'Not Eligible' : 'যোগ্য নন',
          html: language === 'en' 
            ? `<p style="text-align: left;">Your student ID <strong>${formData.studentId}</strong> is not in the eligible list for this program.</p>
                <p style="text-align: left; margin-top: 15px;">Please contact the ICT Cell, CU:</p>
                </br>
                <p style="text-align: left;">
                  <strong>Email:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a><br/>
                  <strong>Visit:</strong> ICT Cell, IT Bhaban, University of Chittagong, Chittagong
                </p>`
            : `<p style="text-align: left;">আপনার শিক্ষার্থী আইডি <strong>${formData.studentId}</strong> এই প্রোগ্রামের যোগ্য তালিকায় নেই।</p>
                <p style="text-align: left; margin-top: 15px;">দয়া করে আই সি টি সেল, চট্টগ্রাম বিশ্ববিদ্যালয়-এ যোগাযোগ করুন:</p>
                </br>
                <p style="text-align: left;">
                  <strong>ইমেইল:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a><br/>
                  <strong>ভিজিট করুন:</strong> আই সি টি সেল, আই টি ভবন, চট্টগ্রাম বিশ্ববিদ্যালয়, চট্টগ্রাম
                </p>`,
          confirmButtonColor: '#001f3f',
          allowOutsideClick: false
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking eligible student:', error);
      Swal.fire({
        icon: 'error',
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        text: language === 'en' 
          ? 'Unable to verify eligibility. Please try again.' 
          : 'যোগ্যতা যাচাই করতে সক্ষম নই। আবার চেষ্টা করুন।',
        confirmButtonColor: '#001f3f'
      });
      setLoading(false);
      return;
    }

    // STEP 2.5: VALIDATE FACULTY AND DEPARTMENT MATCH WITH ELIGIBLE STUDENT DATA
    try {
      // console.log('🚀 Starting faculty/department validation...');
      // console.log('📋 Current form data:', {
      //   studentId: formData.studentId,
      //   faculty: formData.faculty,
      //   department: formData.department
      // });
      // console.log('📊 Faculty data available:', facultyData ? 'YES' : 'NO');

      const validationResult = await validateEligibleStudentInfo(
        formData.studentId,
        formData.faculty,
        formData.department,
        facultyData
      );

      if (!validationResult.valid) {
        Swal.fire({
          icon: 'error',
          title: language === 'en' ? 'Information Mismatch' : 'তথ্য মেলে না',
          html: language === 'en'
            ? `<p style="text-align: left;">The faculty and department you selected do not match the information in our system.</p>
                <p style="text-align: left; margin-top: 15px;">Please ensure you have selected the correct faculty and department, and try again. If the problem persists, please contact the ICT Cell, CU:</p>
                </br>
                <p style="text-align: left;">
                  <strong>Email:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a><br/>
                  <strong>Visit:</strong> ICT Cell, IT Bhaban, University of Chittagong, Chittagong
                </p>`
            : `<p style="text-align: left;">আপনার নির্বাচিত ফ্যাকাল্টি এবং বিভাগ আমাদের সিস্টেমের তথ্যের সাথে মেলে না।</p>
                <p style="text-align: left; margin-top: 15px;">দয়া করে নিশ্চিত করুন যে আপনি সঠিক ফ্যাকাল্টি এবং বিভাগ নির্বাচন করেছেন এবং আবার চেষ্টা করুন। সমস্যা বজায় থাকলে, দয়া করে আই সি টি সেল, চট্টগ্রাম বিশ্ববিদ্যালয়-এ যোগাযোগ করুন:</p>
                </br>
                <p style="text-align: left;">
                  <strong>ইমেইল:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a><br/>
                  <strong>ভিজিট করুন:</strong> আই সি টি সেল, আী টি ভবন, চট্টগ্রাম বিশ্ববিদ্যালয়, চট্টগ্রাম
                </p>`,
          confirmButtonColor: '#001f3f',
          allowOutsideClick: false
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error validating eligible student info:', error);
      Swal.fire({
        icon: 'error',
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        text: language === 'en' 
          ? 'Unable to validate faculty and department information. Please try again.' 
          : 'ফ্যাকাল্টি এবং বিভাগের তথ্য যাচাই করতে সক্ষম নই। আবার চেষ্টা করুন।',
        confirmButtonColor: '#001f3f'
      });
      setLoading(false);
      return;
    }

    // STEP 3: CHECK FOR DUPLICATE SUBMISSION IN SELECTED FACULTY/DEPARTMENT ONLY (1 database read)
    try {
      // Get faculty alias from facultyData
      let facultyAlias = formData.faculty;
      if (facultyData && typeof facultyData === 'object') {
        const facultyObj = Object.values(facultyData).find(f => f && f.name === formData.faculty);
        if (facultyObj && facultyObj.alias) {
          facultyAlias = facultyObj.alias;
        }
      }

      const isDuplicate = await checkDuplicateSubmissionOptimized(
        formData.studentId,
        facultyAlias,
        formData.department
      );
      
      if (isDuplicate) {
        Swal.fire({
          icon: 'error',
          title: language === 'en' ? 'Application Already Exists' : 'আবেদন ইতিমধ্যে জমা দেওয়া হয়েছে',
          html: language === 'en'
            ? `<p style="text-align: left;">There is already an application for the student ID <strong>${formData.studentId}</strong> in our system.</p>
                <p style="text-align: left; margin-top: 15px;">If you have mistakenly submitted or need to update your information, please contact the ICT Cell, CU:</p>
                </br>
                <p style="text-align: left;">
                  <strong>Email:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a><br/>
                  <strong>Visit:</strong> ICT Cell, IT Bhaban, University of Chittagong, Chittagong
                </p>`
            : `<p style="text-align: left;">শিক্ষার্থী আইডি <strong>${formData.studentId}</strong> এর জন্য আমাদের সিস্টেমে ইতিমধ্যে একটি আবেদন রয়েছে।</p>
                <p style="text-align: left; margin-top: 15px;">যদি আপনি ভুলবশত জমা দিয়ে থাকেন বা আপনার তথ্য আপডেট করতে চান, তবে আই সি টি সেল, চট্টগ্রাম বিশ্ববিদ্যালয়-এ যোগাযোগ করুন:</p>
                </br>
                <p style="text-align: left;">
                  <strong>ইমেইল:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a><br/>
                  <strong>ভিজিট করুন:</strong> আই সি টি সেল, আই টি ভবন, চট্টগ্রাম বিশ্ববিদ্যালয়, চট্টগ্রাম
                </p>`,
          confirmButtonColor: '#001f3f',
          allowOutsideClick: false
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking duplicate submission:', error);
      Swal.fire({
        icon: 'error',
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        text: language === 'en' 
          ? 'Unable to verify if an application already exists. Please try again.' 
          : 'আবেদন যাচাই করতে সক্ষম নই। আবার চেষ্টা করুন।',
        confirmButtonColor: '#001f3f'
      });
      setLoading(false);
      return;
    }

    // STEP 4: CHECK STUDENT ID IN CSV (if applicable)
    if (validateStudentId(formData.studentId) && (formData.degreeLevel === 'Bachelor' || formData.degreeLevel === 'Masters')) {
      try {
        const idExists = await checkStudentIdInCSV(formData.studentId);
        if (!idExists) {
          Swal.fire({
            icon: 'error',
            title: language === 'en' ? 'Student ID Not Found' : 'শিক্ষার্থী আইডি পাওয়া যায়নি',
            html: language === 'en' 
              ? `<p style="text-align: left;">The student ID <strong>${formData.studentId}</strong> doesn't exist in the database.</p>
                  <p style="text-align: left; margin-top: 15px;">If you are sure you have entered the correct ID, please contact the ICT Cell, CU:</p>
                  </br>
                  <p style="text-align: left;">
                    <strong>Address:</strong> ICT Cell, IT Bhaban, University of Chittagong, Chittagong<br/>
                    <strong>Email:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a>
                  </p>`
              : `<p style="text-align: left;">শিক্ষার্থী আইডি <strong>${formData.studentId}</strong> ডাটাবেসে পাওয়া যায়নি।</p>
                  <p style="text-align: left; margin-top: 15px;">যদি আপনি নিশ্চিত থাকেন যে আপনি সঠিক আইডি প্রবেশ করেছেন, তবে দয়া করে আই সি টি সেল, চট্টগ্রাম বিশ্ববিদ্যালয়-এ যোগাযোগ করুন:</p>
                  </br>
                  <p style="text-align: left;">
                    <strong>Address:</strong> আইসিটি সেল, আইটি ভবন, চট্টগ্রাম বিশ্ববিদ্যালয়, চট্টগ্রাম<br/>
                    <strong>ইমেইল:</strong> <a href="mailto:tonmoy.ict@cu.ac.bd">tonmoy.ict@cu.ac.bd</a>
                  </p>`,
            confirmButtonColor: '#001f3f',
            allowOutsideClick: false
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking student ID in CSV:', error);
        // Continue with submission even if CSV check fails due to network issues
      }
    }

    // STEP 5: SAVE FORM DATA AND SEND EMAIL
    try {
      // Save form data with faculty data for alias conversion
      await saveStudentForm(formData, facultyData);

      // Send confirmation email to student
      await sendApplicationFormSubmissionEmail(formData, formData.email);

      Swal.fire({
        icon: 'success',
        title: language === 'en' ? 'Success' : 'সফল',
        text: t('successSubmission'),
        confirmButtonColor: '#001f3f'
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        studentId: '',
        session: '',
        faculty: '',
        department: '',
        degreeLevel: 'Bachelor',
        phoneNumber: '',
        email: '',
        aliasEmail: '',
        yearSemesterType: 'year',
        yearSemesterValue: '',
        agreeToTerms: false
      });
      setErrors({});
      setSubmissionExists(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      Swal.fire({
        icon: 'error',
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        text: t('errorSubmission'),
        confirmButtonColor: '#001f3f'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Swal.fire({
      icon: 'question',
      title: language === 'en' ? 'Reset Form?' : 'ফর্ম রিসেট করুন?',
      text: language === 'en' ? 'Are you sure you want to reset the form?' : 'আপনি কি ফর্ম রিসেট করতে চান?',
      showCancelButton: true,
      confirmButtonColor: '#001f3f',
      cancelButtonColor: '#d33',
      confirmButtonText: t('submit'),
      cancelButtonText: t('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData({
          firstName: '',
          lastName: '',
          studentId: '',
          session: '',
          faculty: '',
          department: '',
          phoneNumber: '',
          email: '',
          aliasEmail: '',
          yearSemesterType: 'year',
          yearSemesterValue: '',
          agreeToTerms: false
        });
        setErrors({});
        setSubmissionExists(null);
      }
    });
  };

  return (
    <>
      {/* Show maintenance page if maintenance mode is enabled */}
      {!loadingMaintenance && maintenanceMode ? (
        <MaintenancePage />
      ) : !loadingMaintenance ? (
        <>
          <Helmet>
            <title>{t('formTitle')} | {t('studentForm')}</title>
            <meta name="description" content={t('formDescription')} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Helmet>

          <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, position: 'relative', zIndex: 10 }}>
        <Paper 
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 31, 63, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 31, 63, 0.1)'
          }}
        >
          {/* Header Section */}
          <Box className="text-center mb-8">
            <Typography 
              variant="h3" 
              component="h1" 
              className="font-bold"
              sx={{
                color: '#001f3f',
                mb: 1,
                fontSize: { xs: '24px', sm: '28px', md: '36px' }
              }}
            >
              {t('studentForm')}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{
                color: '#666',
                fontSize: { xs: '14px', sm: '16px' }
              }}
            >
              {t('formDescription')}
            </Typography>
          </Box>

          {/* Form Instruction Alert */}
          <Alert 
            severity="info" 
            sx={{ mb: 4, borderRadius: '8px', background: 'rgba(2, 136, 209, 0.1)', border: '1px solid rgba(2, 136, 209, 0.3)' }}
          >
            <Typography variant="body2" sx={{ fontSize: '14px', color: '#01579b' }}>
              <strong>{t('importantNote')}:</strong> {language === 'en' ? 'Please fill the form in English to ensure consistency in the database.' : 'ডেটাবেসে সামঞ্জস্য নিশ্চিত করতে দয়া করে ফর্মটি ইংরেজিতে পূরণ করুন।'}
            </Typography>
          </Alert>

          {/* Duplicate Submission Alert */}
          {submissionExists && (
            <Alert 
              severity="error" 
              sx={{ mb: 4, borderRadius: '8px' }}
              icon={<CheckCircleIcon />}
            >
              {t('duplicateId')}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information Component */}
            <PersonalInformation
              t={t}
              language={language}
              formData={formData}
              errors={errors}
              loading={loading}
              onInputChange={handleInputChange}
            />

            {/* Academic Information Component */}
            <AcademicInformation
              t={t}
              language={language}
              formData={formData}
              errors={errors}
              loading={loading}
              departments={departments}
              onInputChange={handleInputChange}
              facultyData={facultyData}
            />

            {/* Terms and Conditions Component */}
            <TermsAndConditions
              t={t}
              formData={formData}
              errors={errors}
              loading={loading}
              onCheckboxChange={handleCheckboxChange}
            />

            {/* Action Buttons */}
            <Box 
              sx={{
                display: 'flex',
                gap: { xs: 2, sm: 3 },
                justifyContent: 'center',
                mt: 6,
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap'
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={loading || submissionExists}
                sx={{
                  background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)',
                  px: { xs: 6, sm: 8 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '14px', sm: '16px' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(0, 31, 63, 0.3)'
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  t('submit')
                )}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                sx={{
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  px: { xs: 6, sm: 8 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '14px', sm: '16px' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(211, 47, 47, 0.05)',
                    borderColor: '#d32f2f'
                  }
                }}
              >
                {t('cancel')}
              </Button>
            </Box>

            {/* Contact Information */}
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                {language === 'en' 
                  ? `In case of any queries, feel free to contact at `
                  : `কোনো প্রশ্নের জন্য, নির্দ্বিধায় যোগাযোগ করুন `
                }
                <Typography
                  component="a"
                  href="mailto:tonmoy.ict@cu.ac.bd"
                  sx={{
                    color: '#001f3f',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#ff6f00'
                    }
                  }}
                >
                  tonmoy.ict@cu.ac.bd
                </Typography>
              </Typography>
            </Box>

            {/* Divider Section for Complaints */}
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                my: 6
              }}
            >
              <Box 
                sx={{
                  flex: 1,
                  height: '2px',
                  background: 'linear-gradient(to right, transparent, #ff6f00, transparent)',
                  borderRadius: '1px'
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#ff6f00',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '12px', sm: '14px' },
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {language === 'en' ? 'Having Issues?' : 'সমস্যা হচ্ছে?'}
              </Typography>
              <Box 
                sx={{
                  flex: 1,
                  height: '2px',
                  background: 'linear-gradient(to left, transparent, #ff6f00, transparent)',
                  borderRadius: '1px'
                }}
              />
            </Box>

            {/* Complaints Section Introduction */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  fontSize: { xs: '13px', sm: '15px' },
                  lineHeight: 1.6
                }}
              >
                {language === 'en'
                  ? "If you're facing any issues or have complaints, you can report them here. We will respond to your concerns as soon as possible."
                  : 'যদি আপনি কোনো সমস্যার সম্মুখীন হন বা অভিযোগ থাকে, তবে আপনি এখানে তা রিপোর্ট করতে পারেন। আমরা যত তাড়াতাড়ি সম্ভব আপনার উদ্বেগের সমাধান করব।'}
              </Typography>
            </Box>

            {/* Report Issue Button */}
            <Box 
              sx={{
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button
                type="button"
                variant="contained"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/complaints')}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #ff6f00 0%, #e65100 100%)',
                  px: { xs: 6, sm: 8 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '14px', sm: '16px' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(255, 111, 0, 0.3)',
                    transform: 'translateY(-2px)'
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {language === 'en' ? 'Report Issue / Track Complaints' : 'সমস্যা রিপোর্ট করুন / অভিযোগ ট্র্যাক করুন'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
        </>
      ) : (
        // Show loading spinner while checking maintenance status
        <Box
          sx={{
            minHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #001f3f 0%, #003d7a 100%)'
          }}
        >
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      )}
    </>
  );
};

export default StudentForm;
