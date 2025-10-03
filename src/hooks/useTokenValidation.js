import { useState, useEffect } from 'react';
import { validateToken } from '../utils/tokenUtils';

/**
 * Custom hook for token validation
 */
export const useTokenValidation = (token) => {
  const [tokenValid, setTokenValid] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenValid(true); // Direct access allowed
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);
        setValidationError(null);
        
        console.log('🔐 Validando token:', token);
        const result = await validateToken(token);

        if (result.valid) {
          console.log('✅ Token válido');
          setTokenValid(true);
        } else {
          console.error('❌ Token inválido:', result.reason);
          setTokenValid(false);
          setValidationError(result.reason);
        }
      } catch (error) {
        console.error('❌ Error validando token:', error);
        setTokenValid(false);
        setValidationError(error.message);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token]);

  return {
    tokenValid,
    isValidating,
    validationError,
    isDirectAccess: !token
  };
};

export default useTokenValidation;