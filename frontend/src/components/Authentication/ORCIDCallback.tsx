/**
 * ORCID Callback Component - OAuth 2.0 Return Handler
 * ==================================================
 * 
 * THIS IS WHERE USERS LAND AFTER ORCID LOGIN:
 * 
 * FLOW:
 * 1. User clicked "Authenticate with ORCID" button
 * 2. They got redirected to ORCID.org and logged in
 * 3. ORCID redirected them back to: /orcid/callback?code=abc123
 * 4. This component handles that redirect!
 * 
 * WHAT IT DOES:
 * - Extracts the 'code' parameter from the URL
 * - Calls AuthContext.handleORCIDCallback(code) 
 * - AuthContext sends code to backend for token exchange
 * - Shows loading/success/error states to user
 * - Redirects to main app on success
 * 
 * END RESULT: User is logged in with real ORCID data
 */

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ORCIDCallback Component
 * 
 * This component is rendered when ORCID redirects back to /orcid/callback
 * It extracts the authorization code from the URL and exchanges it for tokens.
 */
function ORCIDCallback() {
  const [searchParams] = useSearchParams();
  const { handleORCIDCallback, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [, setIsProcessing] = useState(true);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('=== ORCID CALLBACK: Processing redirect from ORCID ===');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        
        // EXTRACT DATA FROM URL:
        // ORCID redirected user back with URL like:
        // /orcid/callback?code=abc123 (success)
        // /orcid/callback?error=access_denied (user cancelled)
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const state = searchParams.get('state');

        console.log('URL Parameters extracted:');
        console.log('- code:', code ? code.substring(0, 20) + '...' : 'NOT PRESENT');
        console.log('- error:', errorParam || 'NOT PRESENT');
        console.log('- error_description:', errorDescription || 'NOT PRESENT');
        console.log('- state:', state || 'NOT PRESENT');

        // HANDLE ORCID ERRORS:
        // User cancelled login or ORCID had an issue
        if (errorParam) {
          console.error('ORCID returned error:', errorParam, errorDescription);
          throw new Error(`ORCID authentication failed: ${errorParam}`);
        }

        // NO CODE = SOMETHING WENT WRONG:
        // Should always have either 'code' or 'error' parameter
        if (!code) {
          console.error('No authorization code in URL parameters');
          throw new Error('No authorization code received from ORCID');
        }

        console.log('Valid authorization code received, calling handleORCIDCallback...');
        
        // SUCCESS! PROCESS THE CODE:
        // Call AuthContext to exchange code for token
        // This will: send code to backend → get user data → store user → login complete
        await handleORCIDCallback(code);
        
        console.log('ORCID callback handling completed successfully!');

      } catch (err) {
        console.error('ORCID callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsProcessing(false);
      }
    };

    if (isAuthenticated) {
      // route away if already authenticated 
      console.log("OrcidCallback: Already authenticated")
      navigate("/", { replace: true });
    } else if (hasProcessedRef.current) { 
      // don't call processCallback if already run
      console.log("handleORCIDCallback already called")
    } else {
      hasProcessedRef.current = true; 
      processCallback();
    }
  }, [handleORCIDCallback, isAuthenticated]);

  // Show error state
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          gap: 3,
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Authentication Failed
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            textAlign: 'center'
          }}
        >
          Please try again or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  // Show loading state while processing
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={50} />
      <Typography 
        variant="h6" 
        sx={{ color: 'text.primary' }}
      >
        Completing ORCID Authentication
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        Please wait while we verify your credentials...
      </Typography>
    </Box>
  );
}

export default ORCIDCallback;
