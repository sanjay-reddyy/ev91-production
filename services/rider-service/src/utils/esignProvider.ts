// e-Sign provider integration (mock for now, replace with real provider as needed)
import axios from 'axios';
import 'dotenv/config';

const ESIGN_API_URL = process.env.ESIGN_PROVIDER_URL;
const ESIGN_API_KEY = process.env.ESIGN_PROVIDER_KEY;

export async function esignAgreement({ riderId, agreementData }: { riderId: string, agreementData: any }) {
  // Example: Call a generic e-sign API (replace with real provider logic)
  try {
    const response = await axios.post(
      `${ESIGN_API_URL}/esign`,
      { riderId, agreementData },
      { headers: { 'Authorization': `Bearer ${ESIGN_API_KEY}` } }
    );
    return response.data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error('e-Sign failed: ' + errorMsg);
  }
}
