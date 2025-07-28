// KYC provider integration (mock for now, replace with real provider as needed)
import axios from 'axios';
import 'dotenv/config';

const KYC_API_URL = process.env.KYC_PROVIDER_URL;
const KYC_API_KEY = process.env.KYC_PROVIDER_KEY;

export async function verifyKyc({ aadhaar, pan, dl, selfie }: { aadhaar: string, pan?: string, dl: string, selfie: string }) {
  // Example: Call a generic KYC API (replace with real provider logic)
  try {
    const response = await axios.post(
      `${KYC_API_URL}/verify`,
      { aadhaar, pan, dl, selfie },
      { headers: { 'Authorization': `Bearer ${KYC_API_KEY}` } }
    );
    return response.data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error('KYC verification failed: ' + errorMsg);
  }
}
