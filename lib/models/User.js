import connectMongo from '@/lib/mongodb';
import bcrypt from 'bcrypt';

/**
 * User Model
 * Handles user database operations
 */

const DB_NAME = 'NoteRex';
const COLLECTION_NAME = 'users';

/**
 * Get users collection
 */
async function getUsersCollection() {
  const client = await connectMongo();
  const db = client.db(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * Create a new user
 * @param {Object} userData - User data (email, password, name, etc.)
 * @returns {Promise<Object>} Created user (without password)
 */
export async function createUser(userData) {
  const { email, password, name, image, provider, providerId } = userData;
  
  const users = await getUsersCollection();
  
  // Check if user already exists
  const existingUser = await users.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password if provided
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 12);
  }
  
  // Create user document
  const user = {
    email,
    name: name || email.split('@')[0],
    image: image || null,
    password: hashedPassword,
    provider: provider || 'credentials',
    providerId: providerId || null,
    emailVerified: provider === 'google' ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await users.insertOne(user);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    _id: result.insertedId,
    id: result.insertedId.toString(),
  };
}

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<Object|null>} User or null
 */
export async function findUserByEmail(email) {
  const users = await getUsersCollection();
  return await users.findOne({ email });
}

/**
 * Find user by ID
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object|null>} User or null
 */
export async function findUserById(id) {
  const users = await getUsersCollection();
  const { ObjectId } = await import('mongodb');
  return await users.findOne({ _id: new ObjectId(id) });
}

/**
 * Find user by provider ID (for OAuth)
 * @param {string} provider - Provider name (e.g., 'google')
 * @param {string} providerId - Provider user ID
 * @returns {Promise<Object|null>} User or null
 */
export async function findUserByProvider(provider, providerId) {
  const users = await getUsersCollection();
  return await users.findOne({ provider, providerId });
}

/**
 * Verify password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hashedPassword) {
  if (!hashedPassword) {
    return false;
  }
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
export async function updateUser(id, updates) {
  const users = await getUsersCollection();
  const { ObjectId } = await import('mongodb');
  
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  
  // If updating password, hash it
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12);
  }
  
  await users.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );
  
  const updatedUser = await users.findOne({ _id: new ObjectId(id) });
  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}

/**
 * Convert MongoDB user to NextAuth user format
 * @param {Object} user - MongoDB user document
 * @returns {Object} NextAuth user format
 */
export function formatUserForNextAuth(user) {
  if (!user) return null;
  
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified,
  };
}
