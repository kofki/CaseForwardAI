import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client();

export async function getAuthSession() {
  return await auth0.getSession();
}

export async function requireAuth() {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

