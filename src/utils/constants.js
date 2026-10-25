export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  MEMBER: 'member',
};

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  COMPLETED_BY_COACH: 'completed_by_coach',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const DUES_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
};

export const PAYMENT_METHODS = {
  TRANSFER: 'transfer',
  CASH: 'cash',
  EWALLET: 'e-wallet',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

export const MEMBERSHIP_TYPES = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip',
};

export const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
];

export const DAYS_OF_WEEK = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

export const COURT_SURFACES = {
  HARD: 'hard',
  CLAY: 'clay',
  GRASS: 'grass',
};
