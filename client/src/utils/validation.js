// Password strength calculator
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    longEnough: password.length >= 12,
  };

  Object.values(checks).forEach((passed) => { if (passed) score++; });

  if (score <= 2) return { score, label: 'Weak', color: 'red', percent: 20 };
  if (score <= 3) return { score, label: 'Fair', color: 'amber', percent: 40 };
  if (score <= 4) return { score, label: 'Good', color: 'yellow', percent: 65 };
  if (score <= 5) return { score, label: 'Strong', color: 'emerald', percent: 85 };
  return { score, label: 'Excellent', color: 'emerald', percent: 100 };
}

// Email validation
export function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

// Username validation
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

// Full name validation
export function isValidName(name) {
  return name.trim().length >= 2 && name.trim().length <= 50;
}

// Password validation
export function isValidPassword(password) {
  return password.length >= 6;
}

// Get field error
export function getFieldError(field, value, extra = {}) {
  switch (field) {
    case 'fullName':
      if (!value) return 'Full name is required';
      if (!isValidName(value)) return 'Name must be 2-50 characters';
      return '';
    case 'username':
      if (!value) return 'Username is required';
      if (!isValidUsername(value)) return 'Letters, numbers, underscores only (3-30 chars)';
      return '';
    case 'email':
      if (!value) return 'Email is required';
      if (!isValidEmail(value)) return 'Please enter a valid email';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (!isValidPassword(value)) return 'Minimum 6 characters required';
      return '';
    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      if (value !== extra.password) return 'Passwords do not match';
      return '';
    case 'role':
      if (!value) return 'Please select a role';
      return '';
    default:
      return '';
  }
}
