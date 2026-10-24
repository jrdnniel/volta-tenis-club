import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy', { locale: id });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
};

export const formatTime = (timeString) => {
  if (!timeString) return '-';
  return timeString;
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  return phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
};

export const formatMonth = (month, year) => {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: id });
};
