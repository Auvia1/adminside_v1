/**
 * Form validation utilities
 */

export function validateEmail(email) {
  // Allow empty
  if (!email || !email.trim()) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  // For India: 10 digits
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function validateGST(gst) {
  // GST format: 2 digits (state code) + 10 characters + 1 check digit = 15 chars
  // Pattern: ^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
  if (!gst) return true; // Optional field
  const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
}

export function validateCardExpiry(expiry) {
  // Format: MM/YY
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!expiryRegex.test(expiry)) return false;

  // Check if expiry is not in the past
  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

export function validatePostalCode(postal) {
  // For India: 6 digits - allow empty
  if (!postal || !postal.trim()) return true;
  const postalRegex = /^[0-9]{6}$/;
  return postalRegex.test(postal.replace(/\D/g, ''));
}

export function validatePhone10Digits(phone) {
  // Allow empty
  if (!phone || !phone.trim()) return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

export function validateRequiredFields(formData, requiredFields) {
  const errors = {};
  requiredFields.forEach((field) => {
    if (!formData[field] || String(formData[field]).trim() === '') {
      errors[field] = `${field} is required`;
    }
  });
  return errors;
}

export function validateRegistrationForm(formData) {
  const errors = {};

  // Required fields - strip whitespace
  if (!formData.clinicName?.trim()) {
    errors.clinicName = 'Clinic name is required';
  }
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  }
  if (!formData.phone?.trim()) {
    errors.phone = 'Phone is required';
  }
  if (!formData.ownerName?.trim()) {
    errors.ownerName = 'Owner name is required';
  }
  if (!formData.ownerEmail?.trim()) {
    errors.ownerEmail = 'Owner email is required';
  }

  // Email validation - only check if provided
  if (formData.email?.trim() && !validateEmail(formData.email)) {
    errors.email = 'Invalid email format (e.g., user@example.com)';
  }
  if (formData.ownerEmail?.trim() && !validateEmail(formData.ownerEmail)) {
    errors.ownerEmail = 'Invalid email format (e.g., user@example.com)';
  }
  if (formData.receptionistEmail?.trim() && !validateEmail(formData.receptionistEmail)) {
    errors.receptionistEmail = 'Invalid email format (e.g., user@example.com)';
  }

  // Phone validation (10 digits) - only check if provided
  if (formData.phone?.trim() && !validatePhone10Digits(formData.phone)) {
    errors.phone = 'Phone must be 10 digits (e.g., 9876543210)';
  }
  if (formData.ownerPhone?.trim() && !validatePhone10Digits(formData.ownerPhone)) {
    errors.ownerPhone = 'Phone must be 10 digits (e.g., 9876543210)';
  }
  if (formData.receptionistPhone?.trim() && !validatePhone10Digits(formData.receptionistPhone)) {
    errors.receptionistPhone = 'Phone must be 10 digits (e.g., 9876543210)';
  }

  // GST validation - only check if provided
  if (formData.gstNumber?.trim() && !validateGST(formData.gstNumber)) {
    errors.gstNumber = 'Invalid GST format (5-char state + 10 alphanumeric + Z + check digit)';
  }

  // Card expiry validation - only check if provided
  if (formData.cardExpiry?.trim() && !validateCardExpiry(formData.cardExpiry)) {
    errors.cardExpiry = 'Invalid expiry date (use MM/YY format)';
  }

  // Postal code validation - only check if provided
  if (formData.postal?.trim() && !validatePostalCode(formData.postal)) {
    errors.postal = 'Postal code must be 6 digits';
  }

  return errors;
}
