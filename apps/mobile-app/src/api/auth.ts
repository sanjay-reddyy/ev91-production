import { useMutation } from '@tanstack/react-query';

export function useRegister() {
  return useMutation({
    mutationFn: async (data: { phone: string }) => {
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.37:8000';
      const res = await fetch(`${baseURL}/api/rider-register/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
  });
}

export function useVerifyOTP() {
  return useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.37:8000';
      const res = await fetch(`${baseURL}/api/rider-register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
  });
}

export function useResendOTP() {
  return useMutation({
    mutationFn: async (data: { phone: string }) => {
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.37:8000';
      const res = await fetch(`${baseURL}/api/rider-register/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
  });
}