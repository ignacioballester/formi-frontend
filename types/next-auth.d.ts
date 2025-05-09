import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string; // Ensure this is present
    error?: string;       // Add the error property
    user: {
      // You can add other properties from your user object if needed
      id?: string | null;
    } & DefaultSession['user']; // Keep the default user properties
  }

  // You might also need to extend the User type if you add custom properties there
  // interface User {
  //   // Add custom properties here
  // }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    /** Access token */
    accessToken?: string;
    /** Refresh token */
    refreshToken?: string;
    /** Access token expires at */
    expiresAt?: number; // This should be accessTokenExpires to match usage
    accessTokenExpires?: number; // Explicitly add/use this for clarity
    /** Error message */
    error?: string; // Ensure this is present for the token error
    // User profile fields that might be on the JWT
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string; // Standard subject claim
  }
} 