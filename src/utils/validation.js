// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ID validation - only numbers, must be 8 or 10 digits
export const validateStudentId = (id) => {
  const idRegex = /^\d+$/;
  return idRegex.test(id) && (id.length === 8 || id.length === 10);
};

// Phone number validation - only numbers, 10-11 digits, no +88 or -
export const validatePhoneNumber = (phone) => {
  // Remove all whitespace
  const cleanedPhone = phone.replace(/\s+/g, '');
  // Only digits, 10-11 length
  const phoneRegex = /^\d{10,11}$/;
  return phoneRegex.test(cleanedPhone);
};

// Clean phone number - remove any non-digit characters except leading +
export const cleanPhoneNumber = (phone) => {
  return phone.replace(/[^\d]/g, '');
};

// Validate first and last name
export const validateName = (name) => {
  return name.trim().length > 0 && name.length <= 100;
};

// Validate alias email - alphanumeric and underscore only, no personal email patterns
export const validateAliasEmail = (aliasEmail, studentId = null) => {
  // Only alphanumeric and underscore/dot/hyphen allowed
  const aliasRegex = /^[a-zA-Z0-9._-]+$/;
  
  if (!aliasRegex.test(aliasEmail)) {
    return false;
  }
  
  // Check that it's not empty and reasonable length (minimum 2 characters)
  if (aliasEmail.length < 2 || aliasEmail.length > 30) {
    return false;
  }

  // Check if alias email is same as student ID
  if (studentId && aliasEmail === studentId) {
    return false;
  }

  // Check for forbidden suffixes (case-insensitive)
  const lowerAlias = aliasEmail.toLowerCase();
  const forbiddenSuffixes = ['.', 'cu.ac.bd', 'std.cu.ac.bd'];
  
  for (let suffix of forbiddenSuffixes) {
    if (lowerAlias.endsWith(suffix)) {
      return false;
    }
  }
  
  // Blacklist common personal email patterns (case-insensitive)
  const blacklistedPatterns = ['gmail', 'yahoo', 'hotmail', 'outlook', 'mail', 'yandex', 'proton'];
  
  for (let pattern of blacklistedPatterns) {
    if (lowerAlias.includes(pattern)) {
      return false;
    }
  }
  
  return true;
};

// Validate alias email and return specific error message
export const validateAliasEmailWithError = (aliasEmail, studentId = null, language = 'en') => {
  // Check if empty
  if (!aliasEmail || aliasEmail.trim() === '') {
    return {
      valid: false,
      error: language === 'en' ? 'Alias email is required' : 'উপনাম ইমেল প্রয়োজন'
    };
  }

  // Check for invalid characters
  const aliasRegex = /^[a-zA-Z0-9._-]+$/;
  if (!aliasRegex.test(aliasEmail)) {
    return {
      valid: false,
      error: language === 'en' 
        ? 'Alias email can only contain letters, numbers, dots, hyphens, or underscores'
        : 'উপনাম ইমেল শুধুমাত্র অক্ষর, সংখ্যা, ডট, হাইফেন বা আন্ডারস্কোর থাকতে পারে'
    };
  }
  
  // Check length
  if (aliasEmail.length < 2 || aliasEmail.length > 30) {
    return {
      valid: false,
      error: language === 'en' 
        ? 'Alias email must be between 2 and 30 characters'
        : 'উপনাম ইমেল ২-৩০ অক্ষরের মধ্যে হতে হবে'
    };
  }

  // Check if same as student ID
  if (studentId && aliasEmail === studentId) {
    return {
      valid: false,
      error: language === 'en' 
        ? 'Alias email cannot be the same as Student ID'
        : 'উপনাম ইমেল শিক্ষার্থী আইডির সমান হতে পারে না'
    };
  }

  // Check for forbidden suffixes (case-insensitive)
  const lowerAlias = aliasEmail.toLowerCase();
  const forbiddenSuffixes = ['.', 'cu.ac.bd', 'std.cu.ac.bd'];
  
  for (let suffix of forbiddenSuffixes) {
    if (lowerAlias.endsWith(suffix)) {
      return {
        valid: false,
        error: language === 'en' 
          ? `Alias email cannot end with "${suffix}"`
          : `উপনাম ইমেল "${suffix}" দিয়ে শেষ হতে পারে না`
      };
    }
  }

  // Blacklist common personal email patterns (case-insensitive)
  const blacklistedPatterns = ['gmail', 'yahoo', 'hotmail', 'outlook', 'mail', 'yandex', 'proton'];
  
  for (let pattern of blacklistedPatterns) {
    if (lowerAlias.includes(pattern)) {
      return {
        valid: false,
        error: language === 'en' 
          ? `Alias email cannot contain personal email patterns like "${pattern}"`
          : `উপনাম ইমেল "${pattern}" এর মতো ব্যক্তিগত ইমেল প্যাটার্ন থাকতে পারে না`
      };
    }
  }
  
  return {
    valid: true,
    error: null
  };
};

// Check if all required fields are filled
export const validateFormFields = (formData) => {
  const required = [
    'firstName',
    'lastName',
    'studentId',
    'session',
    'faculty',
    'department',
    'phoneNumber',
    'email',
    'aliasEmail',
    'yearSemesterType',
    'yearSemesterValue',
    'agreeToTerms'
  ];

  for (let field of required) {
    if (!formData[field] || formData[field] === '') {
      return false;
    }
  }
  return true;
};

// Generate random password (10-15 characters with mix of letters, numbers, and symbols)
export const generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*_-+=';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one character from each category
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Check if student ID exists in CSV file
// Uses early-break: stops searching as soon as ID is found
export const checkStudentIdInCSV = async (studentId) => {
  try {
    const response = await fetch('/students.csv');
    
    if (!response.ok) {
      throw new Error('Failed to load CSV file');
    }
    const csvText = await response.text();
    
    // Parse CSV: split by lines (handle both \r\n and \n)
    const lines = csvText.split(/\r?\n/);
    
    // Skip header row (line 0), iterate through CSV lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty lines
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length > 0) {
        const id = columns[0].trim();
        // Found the student ID, return true immediately
        if (id === studentId) {
          // console.log(`CSV Check - Student ID: ${studentId}, Found: true`);
          return true;
        }
      }
    }

    // Student ID not found in CSV
    // console.log(`CSV Check - Student ID: ${studentId}, Found: false`);
    return false;
  } catch (error) {
    console.error('Error checking student ID in CSV:', error);
    // If we can't load the CSV, allow the submission
    return true;
  }
};
