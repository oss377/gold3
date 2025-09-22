
import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { auth, db, signInWithEmailAndPassword, collection, query, where, getDocs } from "../../fconfig";

const JWT_SECRET = process.env.JWT_SECRET || "vN7tL2mQ9rP3kW8yJ4hB5xC1dT6fM9zR2pK8wN3eJ5uQ4tL";

// Validate environment variables at runtime
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

export async function POST(request: NextRequest) {
  try {
    // Validate Firebase initialization
    if (!auth || !db) {
      console.error("Firebase initialization failed: auth or db is undefined");
      return NextResponse.json(
        { error: "Firebase not initialized. Please check configuration." },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Attempt to sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check admin collection
    const adminRef = collection(db, "admin");
    const adminQuery = query(adminRef, where("email", "==", user.email));
    const adminSnapshot = await getDocs(adminQuery);

    let role = null;
    let token = null;
    let category = null;

    if (!adminSnapshot.empty) {
      role = "admin";
      token = jwt.sign(
        { userId: user.uid, email: user.email, role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
    } else {
      // Check GYM collection for users by email
      const userRef = collection(db, "GYM");
      const userQuery = query(userRef, where("email", "==", user.email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        role = "user";
        const userData = userSnapshot.docs[0].data();
        category = userData.category;
        if (!category) {
          console.warn(`No category found for user with email ${user.email}.`);
          return NextResponse.json(
            { error: "User category not defined in GYM collection." },
            { status: 403 }
          );
        }
        token = jwt.sign(
          { userId: user.uid, email: user.email, role, category },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
      } else {
        console.error(`User not found in GYM collection for email: ${user.email}`);
        return NextResponse.json(
          { error: "User data not found in GYM collection." },
          { status: 403 }
        );
      }
    }

    // Set session cookie
    const response = NextResponse.json({
      message: "Login successful",
      userId: user.uid,
      email: user.email,
      role,
      category: role === "user" ? category : undefined,
    });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hour
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error: unknown) {
    let errorMessage = "Login failed. Please check your credentials.";
    let status = 401;

    if (error instanceof Error) {
      console.error("Login error:", {
        code: (error as any).code,
        message: error.message,
        stack: error.stack,
      });

      switch ((error as any).code) {
        case "auth/invalid-api-key":
          errorMessage = "Invalid Firebase API key. Please contact support.";
          status = 500;
          break;
        case "auth/user-not-found":
          errorMessage = "No user found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = `Login failed: ${error.message || "Unknown error"}`;
      }
    } else {
      console.error("Unexpected error type:", error);
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export const dynamic = "force-dynamic";