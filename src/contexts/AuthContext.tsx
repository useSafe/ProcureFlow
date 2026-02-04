import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types/procurement';
import { getStoredUser, setStoredUser } from '@/lib/storage';
import { db } from '@/lib/firebase';
import { ref, get, set, child } from 'firebase/database';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Input sanitization to prevent SQL injection and XSS
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['";\\]/g, '') // Remove SQL injection characters
    .replace(/--/g, '') // Remove SQL comment syntax
    .replace(/\/\*/g, '') // Remove SQL comment syntax
    .replace(/\*\//g, ''); // Remove SQL comment syntax
};

// Password validation
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least 1 special character');
  }

  return { valid: errors.length === 0, errors };
};

// Hash password using Web Crypto API (SHA-256)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sanitize inputs to prevent SQL injection
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email.toLowerCase());

      // Validate inputs
      if (!sanitizedName || sanitizedName.length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' };
      }

      if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Validate password
      const validation = validatePassword(password);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0] };
      }

      // Check if user already exists
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const existingUser = Object.values(users).find(
          (u: any) => u.email.toLowerCase() === sanitizedEmail
        );

        if (existingUser) {
          return { success: false, error: 'An account with this email already exists' };
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const userId = crypto.randomUUID();
      const newUser: User & { passwordHash: string } = {
        id: userId,
        email: sanitizedEmail,
        name: sanitizedName,
        passwordHash: hashedPassword,
      };

      // Save to Firebase
      await set(ref(db, `users/${userId}`), newUser);

      // Set user session (without password hash)
      const userSession: User = {
        id: userId,
        email: sanitizedEmail,
        name: sanitizedName,
      };

      setUser(userSession);
      setStoredUser(userSession);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sanitize inputs to prevent SQL injection
      const sanitizedEmail = sanitizeInput(email.toLowerCase());

      // Validate password format
      const validation = validatePassword(password);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0] };
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check registered users in Firebase
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const foundUser = Object.values(users).find(
          (u: any) => u.email.toLowerCase() === sanitizedEmail
        ) as (User & { passwordHash: string }) | undefined;

        if (foundUser) {
          // Verify password
          const hashedPassword = await hashPassword(password);

          if (hashedPassword === foundUser.passwordHash) {
            // Login successful
            const userSession: User = {
              id: foundUser.id,
              email: foundUser.email,
              name: foundUser.name,
            };
            setUser(userSession);
            setStoredUser(userSession);
            return { success: true };
          }
        }
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setStoredUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

