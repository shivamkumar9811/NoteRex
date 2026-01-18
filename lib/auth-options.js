import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth options - no top-level User/Mongo/bcrypt import.
 * User is lazy-loaded only in authorize and signIn (avoids 500 on Vercel when those deps fail at load).
 * Google only when env set.
 */
const providers = [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
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
      const { findUserByEmail, verifyPassword, formatUserForNextAuth } = await import('@/lib/models/User');
      const user = await findUserByEmail(credentials.email);
      if (!user) throw new Error('Invalid email or password');
      const isValid = await verifyPassword(credentials.password, user.password);
      if (!isValid) throw new Error('Invalid email or password');
      return formatUserForNextAuth(user);
    },
  }),
];

export const authOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          if (!user?.email || !account?.providerAccountId) return false;
          const { findUserByProvider, findUserByEmail, createUser } = await import('@/lib/models/User');
          let dbUser = await findUserByProvider('google', account.providerAccountId);
          if (!dbUser) {
            const existingUser = await findUserByEmail(user.email);
            if (existingUser) {
              const { ObjectId } = await import('mongodb');
              const connectMongo = (await import('@/lib/mongodb')).default;
              const client = await connectMongo();
              const db = client.db('NoteRex');
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
              try {
                dbUser = await createUser({
                  email: user.email,
                  name: user.name || user.email.split('@')[0],
                  image: user.image,
                  provider: 'google',
                  providerId: account.providerAccountId,
                });
              } catch (createError) {
                if (createError.message === 'User already exists') {
                  const raceConditionUser = await findUserByEmail(user.email);
                  if (raceConditionUser) {
                    const connectMongo = (await import('@/lib/mongodb')).default;
                    const client = await connectMongo();
                    const db = client.db('NoteRex');
                    const usersCollection = db.collection('users');
                    await usersCollection.updateOne(
                      { _id: raceConditionUser._id },
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
                    throw createError;
                  }
                } else {
                  throw createError;
                }
              }
            }
          }
          if (!dbUser || !dbUser._id) return false;
          user.id = dbUser._id.toString();
          user.name = dbUser.name || user.name;
          user.image = dbUser.image || user.image;
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session?.user) {
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
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
