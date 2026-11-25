
import { demoEmployee } from '@/config/employee-session';

// ========================================
// Types and interfaces
// ========================================

export type DigitalAction =
  | 'password'
  | 'otp'
  | 'suspend'
  | 'restore';

export interface DigitalProfile {
  suspended: boolean;
  otpAttempts: number;
  resetRequestedAt: string | null;

  history: {
    id: string;
    action: DigitalAction;
    at: string;
    employee: string;
    reason: string;
  }[];
}

// ========================================
// Local storage configuration
// ========================================

const storageKey = (customerId: number) =>
  `northshield-digital-banking-v1-${customerId}`;

// ========================================
// Read customer digital banking profile
// ========================================

export function readDigitalProfile(
  customerId: number
): DigitalProfile {

  const initial: DigitalProfile = {
    suspended: false,
    otpAttempts: customerId === 2 ? 3 : 0,
    resetRequestedAt: null,
    history: [],
  };

  const raw = localStorage.getItem(
    storageKey(customerId)
  );

  if (raw) {
    return JSON.parse(raw) as DigitalProfile;
  }

  return initial;
}

// ========================================
// Apply digital banking servicing action
// ========================================

export function applyDigitalAction(
  customerId: number,
  action: DigitalAction,
  reason: string
): DigitalProfile {

  const profile = readDigitalProfile(customerId);
  const at = new Date().toISOString();

  // Validate servicing reason

  if (!reason.trim()) {
    throw new Error(
      'A servicing reason is required.'
    );
  }

  switch (action) {

    // ====================================
    // Password reset
    // ====================================

    case 'password':

      if (profile.suspended) {
        throw new Error(
          'Digital access is suspended.'
        );
      }

      if (
        profile.resetRequestedAt &&
        Date.now() -
          Date.parse(profile.resetRequestedAt) < 300000
      ) {
        throw new Error(
          'A reset request is already pending.'
        );
      }

      profile.resetRequestedAt = at;

      break;

    // ====================================
    // OTP unlock
    // ====================================

    case 'otp':

      if (!profile.otpAttempts) {
        throw new Error(
          'OTP access is not locked.'
        );
      }

      profile.otpAttempts = 0;

      break;

    // ====================================
    // Suspend digital banking access
    // ====================================

    case 'suspend':

      if (profile.suspended) {
        throw new Error(
          'Access is already suspended.'
        );
      }

      profile.suspended = true;
      profile.resetRequestedAt = null;

      break;

    // ====================================
    // Restore digital banking access
    // ====================================

    case 'restore':

      if (!profile.suspended) {
        throw new Error(
          'Access is already active.'
        );
      }

      profile.suspended = false;

      break;
  }

  // ======================================
  // Record servicing history
  // ======================================

  profile.history.unshift({
    id: crypto.randomUUID(),
    action,
    at,
    employee: demoEmployee.id,
    reason: reason.trim(),
  });

  // ======================================
  // Save updated customer profile
  // ======================================

  localStorage.setItem(
    storageKey(customerId),
    JSON.stringify(profile)
  );

  return profile;
}
