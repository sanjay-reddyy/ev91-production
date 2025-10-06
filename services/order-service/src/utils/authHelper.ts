import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Auth service URL
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    teamId?: string;
  };
}

/**
 * Helper function to get auth token for testing purposes
 * @param email User email
 * @param password User password
 * @returns Auth token
 */
export const getAuthToken = async (
  email: string = "admin@ev91.com",
  password: string = "admin123"
): Promise<string> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${AUTH_SERVICE_URL}/api/auth/login`,
      {
        email,
        password,
      }
    );

    return response.data.token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw new Error(
      `Failed to get auth token: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Helper function to get user roles from auth service
 * @param token Auth token
 * @returns Array of role names
 */
export const getUserRoles = async (token: string): Promise<string[]> => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.roles;
  } catch (error) {
    console.error("Error getting user roles:", error);
    throw new Error(
      `Failed to get user roles: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Helper function to verify if a token is valid
 * @param token Auth token
 * @returns Boolean indicating if token is valid
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return true;
  } catch (error) {
    return false;
  }
};
