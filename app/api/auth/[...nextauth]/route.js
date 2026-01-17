import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  createUser,
  findUserByEmail,
  findUserByProvider,
  findUserById,
  verifyPassword,
  formatUserForNextAuth,
} from '@/lib/models/User';

/**
 * NextAuth Configuration
 * Handles Google OAuth and Email/Password authentication
 */

export const authOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    // Credentials Provider (Email + Password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user by email
        const user = await findUserByEmail(credentials.email);
        
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Verify password
        const isValid = await verifyPassword(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Return user in NextAuth format
        return formatUserForNextAuth(user);
      },
    }),
  ],

  callbacks: {
    /**
     * Called when a user signs in
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists by provider ID
          let dbUser = await findUserByProvider('google', account.providerAccountId);
          
          if (!dbUser) {
            // Check if user exists by email (link accounts)
            const existingUser = await findUserByEmail(user.email);
            
            if (existingUser) {
              // Link Google account to existing user
              const { ObjectId } = await import('mongodb');
              const connectMongo = (await import('@/lib/mongodb')).default;
              const client = await connectMongo();
              const db = client.db('noteforge');
              const usersCollection = db.collection('users');
              
              await usersCollection.updateOne(
                { _id: existingUser._id },
                {
                  $set: {
                    provider: 'google',
                    providerId: account.providerAccountId,
                    image: user.image,
                    emailVerified: new Date(),
                    updatedAt: new Date(),
                  },
                }
              );
              
              dbUser = await findUserByProvider('google', account.providerAccountId);
            } else {
              // Create new user
              dbUser = await createUser({
                email: user.email,
                name: user.name,
                image: user.image,
                provider: 'google',
                providerId: account.providerAccountId,
              });
            }
          }
          
          // Update user object for session
          user.id = dbUser._id.toString();
          user.name = dbUser.name;
          user.image = dbUser.image;
          
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      
      // For credentials provider, user is already validated in authorize()
      return true;
    },

    /**
     * Called when a JWT is created or updated
     */
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      
      return token;
    },

    /**
     * Called whenever a session is checked
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
      }
      
      return session;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
