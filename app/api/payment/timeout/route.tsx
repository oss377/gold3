import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../fconfig"; // ✅ adjust import path if needed
import {
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  doc,
} from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    // Find pending payments that have expired
    const now = new Date().toISOString();
    const q = query(
      collection(db, "payments"),
      where("status", "==", "pending"),
      where("expiresAt", "<=", now)
    );
    const querySnapshot = await getDocs(q);

    for (const paymentDoc of querySnapshot.docs) {
      const paymentData = paymentDoc.data();
      const paymentId = paymentDoc.id;
      const selectedSeats = paymentData.seatIds || [];

      await runTransaction(db, async (transaction) => {
        const arrangementDocs = await Promise.all(
          selectedSeats.map(async (seatId: string) => {
            const q = query(collection(db, "seatArrangements"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.find((doc) =>
              doc.data().seats.some((s: { id: string }) => s.id === seatId)
            );
          })
        );

        for (const seatId of selectedSeats) {
          const arrangementDoc = arrangementDocs.find((doc) =>
            doc?.data().seats.some((s: { id: string }) => s.id === seatId)
          );
          if (!arrangementDoc) continue;

          const arrangementRef = doc(db, "seatArrangements", arrangementDoc.id);
          const arrangement = arrangementDoc.data();
          const updatedSeats = arrangement.seats.map(
            (s: { id: string; state: string }) =>
              s.id === seatId ? { ...s, state: "available" } : s
          );
          transaction.update(arrangementRef, { seats: updatedSeats });
        }

        const paymentRef = doc(db, "payments", paymentId);
        transaction.update(paymentRef, {
          status: "timeout",
          updatedAt: new Date().toISOString(),
        });
      });
    }

    return NextResponse.json({ message: "Processed expired payments" });
  } catch (error: any) {
    console.error("Error in payment timeout:", error.message);
    return NextResponse.json(
      { error: "Failed to process payment timeouts" },
      { status: 500 }
    );
  }
}
