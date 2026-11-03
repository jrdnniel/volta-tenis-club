export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return re.test(phone.replace(/[- ]/g, ''));
};

export const validateRequired = (value) => {
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
};

export const validateMinLength = (value, min) => {
  return typeof value === 'string' && value.trim().length >= min;
};

export const isTimeOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};
