/**
 * Authentication Types
 * 
 * Type definitions for authentication-related components and functions.
 */

/**
 * User credentials for manual login (development mode)
 */
export interface LoginCredentials {
  orcidId: string;
}

/**
 * ORCID authentication response from backend
 */
export interface ORCIDAuthResponse {
  orcid_id: string;
  access_token: string;
  name?: string;
  expires_in?: number;
}

/**
 * Props for LoginPage component
 */
export interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => void;
  onORCIDLogin: () => void;
  isLoading?: boolean;
}

/**
 * Props for AuthGuard component
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading?: boolean;
  fallback?: React.ReactNode;
}

/**
 * User information stored in authentication context
 */
export interface UserInfo {
  orcidId: string;        // User's ORCID identifier
  name?: string;          // User's name from ORCID
  accessToken?: string;   // ORCID access token
  authMethod: 'orcid' | 'development'; // How the user authenticated
}

/**
 * Authentication context state
 */
export interface AuthContextState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<void>;
  loginWithORCID: () => Promise<void>;
  handleORCIDCallback: (code: string) => Promise<void>;
  logout: () => void;
}

/**
 * Dataset recieved from Crucible
 */
export interface Dataset {
  dsid: string; 
  datasetName: string; 
  creationTime: string; 
}