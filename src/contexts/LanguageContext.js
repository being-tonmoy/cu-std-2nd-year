import React, { createContext, useState, useCallback } from 'react';

export const LanguageContext = createContext();

// Translation dictionary
const translations = {
  en: {
    home: 'Home',
    studentForm: 'Student Information Form',
    firstName: 'First Name',
    lastName: 'Last Name',
    studentId: 'Student ID',
    session: 'Session',
    faculty: 'Faculty',
    department: 'Department',
    phoneNumber: 'Phone Number',
    primaryEmail: 'Personal Email',
    aliasEmail: 'Institutional Email Alias (Username Only)',
    aliasEmailHelper: 'Do not enter any personal email here such as gmail/yahoo etc. All emails sent to your alias will automatically arrive in your main inbox. You can also send emails using your alias once it\'s added to your account settings.',
    aliasEmailUnavailable: 'This alias email is not available',
    aliasEmailAvailable: 'This alias email is available',
    contactAuthority: 'Please contact university authority to create an alias email',
    currentYearSemester: 'Current Year/Semester',
    year: 'Year',
    semester: 'Semester',
    firstYear: '1st Year',
    secondYear: '2nd Year',
    firstSemester: '1st Semester',
    secondSemester: '2nd Semester',
    thirdSemester: '3rd Semester',
    submit: 'Submit',
    cancel: 'Cancel',
    required: 'This field is required',
    invalidId: 'Student ID must contain only numbers',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Phone number must contain only numbers (10-11 digits)',
    duplicateId: 'A form with this Student ID already exists',
    successSubmission: 'Form submitted successfully!',
    errorSubmission: 'Error submitting form. Please try again.',
    emailWarning: 'An email will be sent to this address and you will further be contacted through this email. Please note: Do not enter your personal email with storage capacity issues, as you may not receive the email.',
    emailWarningFormal: 'An institutional email will be provisioned to your registered email address. Ensure the provided email is valid and accessible. The University of Chittagong will communicate further updates and credentials through this email. Kindly refrain from using email accounts with limited storage capacity to prevent potential communication delays.',
    termsAndConditions: 'I have read and understood that I will receive an institutional email from the University of Chittagong. If any information I provide is false or incorrect, the responsibility is solely mine.',
    selectOption: 'Select an option',
    loading: 'Loading...',
    formTitle: 'Student Information Form - University of Chittagong (2024-2025 Session)',
    formDescription: 'Please fill in all the required fields to complete the registration process.',
    noSubmissionsMessage: 'Checking submissions...',
    importantNote: 'Important Note',
    formEnglishInstruction: 'Please fill out this form entirely in English. All information must be entered in English characters.',
  },
  bn: {
    home: 'হোম',
    studentForm: 'শিক্ষার্থী তথ্য ফর্ম',
    firstName: 'প্রথম নাম',
    lastName: 'শেষ নাম',
    studentId: 'শিক্ষার্থী আইডি',
    session: 'সেশন',
    faculty: 'অনুষদ',
    department: 'বিভাগ',
    phoneNumber: 'ফোন নম্বর',
    primaryEmail: 'ব্যক্তিগত ইমেল',
    aliasEmail: 'প্রাতিষ্ঠানিক ইমেল উপনাম (শুধুমাত্র ব্যবহারকারীর নাম)',
    aliasEmailHelper: 'এখানে কোনো ব্যক্তিগত ইমেল যেমন জিমেইল/ইয়াহু ইত্যাদি প্রবেश করবেন না। আপনার উপনামে পাঠানো সমস্ত ইমেল স্বয়ংক্রিয়ভাবে আপনার মূল ইনবক্সে পৌঁছাবে। আপনার অ্যাকাউন্ট সেটিংসে যোগ করার পরে আপনি আপনার উপনাম ব্যবহার করে ইমেলও পাঠাতে পারবেন।',
    aliasEmailUnavailable: 'এই উপনাম ইমেল উপলব্ধ নয়',
    aliasEmailAvailable: 'এই উপনাম ইমেল উপলব্ধ',
    contactAuthority: 'অনুগ্রহ করে একটি উপনাম ইমেল তৈরি করতে বিশ্ববিদ্যালয়ের কর্তৃপক্ষের সাথে যোগাযোগ করুন',
    currentYearSemester: 'বর্তমান বছর/সেমিস্টার',
    year: 'বছর',
    semester: 'সেমিস্টার',
    firstYear: '১ম বছর',
    secondYear: '২য় বছর',
    firstSemester: '১ম সেমিস্টার',
    secondSemester: '২য় সেমিস্টার',
    thirdSemester: '৩য় সেমিস্টার',
    fourthSemester: '৪র্থ সেমিস্টার',
    submit: 'জমা দিন',
    cancel: 'বাতিল',
    required: 'এই ফিল্ডটি প্রয়োজনীয়',
    invalidId: 'শিক্ষার্থী আইডি শুধুমাত্র সংখ্যা থাকতে পারে',
    invalidEmail: 'অনুগ্রহ করে বৈধ ইমেল ঠিকানা প্রবেশ করুন',
    invalidPhone: 'ফোন নম্বরে শুধুমাত্র সংখ্যা থাকতে পারে (১০-১১ অঙ্ক)',
    duplicateId: 'এই শিক্ষার্থী আইডি দিয়ে একটি ফর্ম ইতিমধ্যে বিদ্যমান',
    successSubmission: 'ফর্ম সফলভাবে জমা দেওয়া হয়েছে!',
    errorSubmission: 'ফর্ম জমা দিতে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।',
    emailWarning: 'এই ঠিকানায় একটি ইমেল পাঠানো হবে এবং আপনি এই ইমেলের মাধ্যমে আরও যোগাযোগ করা হবে। দয়া করে মনোযোগ দিন: আপনার ব্যক্তিগত ইমেল যাতে স্টোরেজ সমস্যা না থাকে তা প্রবেশ করবেন না, নতুবা আপনি ইমেল পাবেন না।',
    emailWarningFormal: 'আপনার নিবন্ধিত ইমেল ঠিকানায় একটি প্রাতিষ্ঠানিক ইমেল প্রদান করা হবে। নিশ্চিত করুন যে প্রদত্ত ইমেলটি বৈধ এবং অ্যাক্সেসযোগ্য। চট্টগ্রাম বিশ্ববিদ্যালয় এই ইমেলের মাধ্যমে আরও আপডেট এবং প্রমাণপত্র পাঠাবে। সম্ভাব্য যোগাযোগ বিলম্ব এড়াতে সীমিত স্টোরেজ ক্ষমতা সহ ইমেল অ্যাকাউন্ট ব্যবহার করবেন না।',
    termsAndConditions: 'আমি বুঝেছি এবং সম্মতি দিয়েছি যে চট্টগ্রাম বিশ্ববিদ্যালয় থেকে আমি একটি প্রাতিষ্ঠানিক ইমেল পাব। যদি আমি যে কোনও তথ্য মিথ্যা বা ভুল প্রদান করি তবে তার দায়িত্ব শুধুমাত্র আমার।',
    selectOption: 'একটি বিকল্প নির্বাচন করুন',
    loading: 'লোড হচ্ছে...',
    formTitle: 'শিক্ষার্থী তথ্য ফর্ম - চট্টগ্রাম বিশ্ববিদ্যালয় (২০২৪-২০২৫ সেশন)',
    formDescription: 'নিবন্ধন প্রক্রিয়া সম্পন্ন করতে অনুগ্রহ করে সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন।',
    noSubmissionsMessage: 'জমা দেওয়া পরীক্ষা করছি...',
    importantNote: 'গুরুত্বপূর্ণ বিঃদ্রঃ',
    formEnglishInstruction: 'অনুগ্রহ করে এই ফর্মটি সম্পূর্ণভাবে ইংরেজিতে পূরণ করুন। সমস্ত তথ্য ইংরেজি অক্ষরে প্রবেশ করতে হবে।'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
