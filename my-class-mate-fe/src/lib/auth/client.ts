'use client';

import type { User } from '@/types/user';
import { login, LoginRequest } from '@/api/login-api';

function generateToken(): string {
  const arr = new Uint8Array(12);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

const user = {
  id: 'USR-000',
  avatar: '/assets/avatar.png',
  firstName: 'Sofia',
  lastName: 'Rivers',
  email: 'sofia@devias.io',
} satisfies User;

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  username: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

class AuthClient {
  async signUp(_: SignUpParams): Promise<{ error?: string }> {
    // Make API request

    // We do not handle the API, so we'll just generate a token and store it in localStorage.
    const token = generateToken();
    localStorage.setItem('custom-auth-token', token);

    return {};
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    const { username, password } = params;

    // Make API request

    const request: LoginRequest = {
      username: username,
      password: password,
    };

    try {
      const userData = await login(request)
      const token = generateToken();
      const localStorageData = {
        'custom-auth-token': token,
        'user-id': userData.userId,
        'user-name': userData.username,
        'user-role': userData.role,
      };
    
      Object.entries(localStorageData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error: any) {
      const message =
        error?.message || "Something went wrong while signing in.";
      return { error: message };
    }


    // We do not handle the API, so we'll check if the credentials match with the hardcoded ones.
    // if (email !== 'sofia@devias.io' || password !== 'Secret1') {
    //   return { error: 'Invalid credentials' };
    // }

    // const token = generateToken();
    // localStorage.setItem('custom-auth-token', token);

    return {};
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    // Make API request

    // We do not handle the API, so just check if we have a token in localStorage.
    const token = localStorage.getItem('custom-auth-token');

    if (!token) {
      return { data: null };
    }

    return { data: user };
  }

  async signOut(): Promise<{ error?: string }> {
    const keys = [
      'custom-auth-token',
      'user-id',
      'user-name',
      'user-role',
    ];

    keys.forEach((key) => localStorage.removeItem(key));
    
    return {};
  }
}

export const authClient = new AuthClient();
