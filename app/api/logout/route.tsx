import { NextResponse, NextRequest } from "next/server";
import { getAuth, signOut } from "firebase/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    await signOut(auth);

    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire cookie immediately
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error: unknown) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to log out. Please try again." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";