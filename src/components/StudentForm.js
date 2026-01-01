import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Swal from 'sweetalert2';
import { useLanguage } from '../hooks/useLanguage';
import { 
  validateEmail, 
  validateStudentId, 
  validatePhoneNumber, 
  validateName,
  cleanPhoneNumber,
  validateAliasEmail
} from '../utils/validation';
import { 
  checkDuplicateSubmission, 
  saveStudentForm,
  getFacultyData
} from '../services/firestoreService';
import PersonalInformation from './StudentForm/PersonalInformation';
import AcademicInformation from './StudentForm/AcademicInformation';
import TermsAndConditions from './StudentForm/TermsAndConditions';

const StudentForm = () => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submissionExists, setSubmissionExists] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [facultyData, setFacultyData] = useState(null);

  // Load faculty data on component mount
  useEffect(() => {
    loadFacultyDataFromFirestore();
  }, []);

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
      newErrors.studentId = t('invalidId');
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

    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = t('invalidPhone');
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      newErrors.email = t('invalidEmail');
    }

    // Validate alias email format
    if (!validateAliasEmail(formData.aliasEmail)) {
      newErrors.aliasEmail = language === 'en' 
        ? 'Invalid alias email format. Use 2-30 characters: letters, numbers, dots, hyphens, or underscores.' 
        : 'অবৈধ উপনাম ইমেল ফরম্যাট। ২-৩০ অক্ষর ব্যবহার করুন: অক্ষর, সংখ্যা, ডট, হাইফেন বা আন্ডারস্কোর।';
    } else if (!formData.aliasEmail || formData.aliasEmail.trim() === '') {
      newErrors.aliasEmail = t('required');
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

    // Check for duplicate submission first
    if (validateStudentId(formData.studentId)) {
      setLoading(true);
      try {
        const isDuplicate = await checkDuplicateSubmission(formData.studentId);
        if (isDuplicate) {
          Swal.fire({
            icon: 'error',
            title: language === 'en' ? 'Duplicate Submission' : 'ডুপ্লিকেট জমা দেওয়া',
            text: t('duplicateId'),
            confirmButtonColor: '#001f3f'
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking submission:', error);
        Swal.fire({
          icon: 'error',
          title: language === 'en' ? 'Error' : 'ত্রুটি',
          text: language === 'en' ? 'Error checking duplicate submission' : 'ডুপ্লিকেট জমা যাচাই করতে ত্রুটি',
          confirmButtonColor: '#001f3f'
        });
        setLoading(false);
        return;
      }
      setLoading(false);
    }

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
        phoneNumber: 'Phone Number',
        email: 'Email',
        aliasEmail: 'Alias Email',
        yearSemesterValue: 'Year/Semester',
        agreeToTerms: 'Terms and Conditions'
      };
      
      const errorMessage = errorFields.length > 0 
        ? `Please correct: ${errorFields.map(f => fieldLabels[f] || f).join(', ')}`
        : 'Please correct the errors in the form';

      Swal.fire({
        icon: 'error',
        title: language === 'en' ? 'Validation Error' : 'বৈধতা ত্রুটি',
        text: language === 'en' ? errorMessage : 'ফর্মের ত্রুটিগুলি সংশোধন করুন',
        confirmButtonColor: '#001f3f'
      });
      return;
    }

    setLoading(true);

    try {
      // Save form data with faculty data for alias conversion
      await saveStudentForm(formData, facultyData);

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

          {/* English Form Instruction Alert */}
          <Alert 
            severity="info" 
            sx={{ mb: 4, borderRadius: '8px', background: 'rgba(2, 136, 209, 0.1)', border: '1px solid rgba(2, 136, 209, 0.3)' }}
          >
            <Typography variant="body2" sx={{ fontSize: '14px', color: '#01579b' }}>
              <strong>{t('importantNote')}:</strong> {t('formEnglishInstruction')}
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
                flexDirection: { xs: 'column', sm: 'row' }
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
          </form>
        </Paper>
      </Container>
    </>
  );
};

export default StudentForm;
