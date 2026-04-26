import React, { createContext, useContext, useEffect, useState } from 'react';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isTestMode: boolean;
}

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Check test mode from URL
const getIsTestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('test') === '1';
};

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  isTestMode: false,
});

export const useFirebase = () => useContext(FirebaseContext);

// Mock user for test mode
const MOCK_USER: User = {
  uid: 'dev-user-001',
  email: 'nicola@test.dev',
  displayName: 'Nicola (Dev Mode)',
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const testMode = getIsTestMode();
    setIsTestMode(testMode);

    if (testMode) {
      // In test mode, use mock user immediately - no Firebase initialization
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // For production, would initialize Firebase here
    // For now, also set loading to false to allow testing without Firebase
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, isTestMode }}>
      {children}
    </FirebaseContext.Provider>
  );
};