import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminAuth, adminDb } from '@/app/firebase-admin';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request) {
  try {
    // Check Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json' },
        { status: 400 }
      );
    }

    // Parse request body safely
    let email, idToken;
    try {
      const body = await request.json();
      ({ email, idToken } = body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!email || !idToken) {
      return NextResponse.json(
        { error: 'Email and ID token are required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const firebaseUserId = decodedToken.uid;

    // List of collections to check for user role
    const collections = [
      "aerobics",
      "consult",
      "gym",
      "karate",
      "personalTraining",
      "registrations",
      "videos",
      "users",
      "admin",
      "owner"
    ];

    let role = 'user'; // Default role

    // Check each collection for the user's role
    for (const collectionName of collections) {
      const userQuery = query(
        collection(adminDb, collectionName),
        where('email', '==', email)
      );
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        role = userData.role || collectionName;
        break;
      }
    }

    // Prepare response
    const response = NextResponse.json({
      message: 'Login successful',
      role,
      email
    });

    // Set role-specific cookie (optional)
    if (role === 'admin' || role === 'owner') {
      response.cookies.set('user_role', role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600, // 1 hour
        path: '/',
        sameSite: 'strict',
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Login failed';
    let status = 401;

    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Session revoked. Please log in again.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid credentials. Please try again.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Account disabled. Please contact support.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found. Please check your email.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}

export const dynamic = 'force-dynamic';