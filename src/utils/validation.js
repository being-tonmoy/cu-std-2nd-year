// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ID validation - only numbers
export const validateStudentId = (id) => {
  const idRegex = /^\d+$/;
  return idRegex.test(id) && id.length > 0;
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
export const validateAliasEmail = (aliasEmail) => {
  // Only alphanumeric and underscore/dot/hyphen allowed
  const aliasRegex = /^[a-zA-Z0-9._-]+$/;
  
  if (!aliasRegex.test(aliasEmail)) {
    return false;
  }
  
  // Check that it's not empty and reasonable length (minimum 2 characters)
  if (aliasEmail.length < 2 || aliasEmail.length > 30) {
    return false;
  }
  
  // Blacklist common personal email patterns (case-insensitive)
  const blacklistedPatterns = ['gmail', 'yahoo', 'hotmail', 'outlook', 'mail', 'yandex', 'proton'];
  const lowerAlias = aliasEmail.toLowerCase();
  
  for (let pattern of blacklistedPatterns) {
    if (lowerAlias.includes(pattern)) {
      return false;
    }
  }
  
  return true;
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
