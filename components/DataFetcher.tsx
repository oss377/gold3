import { useState, useEffect } from "react";
import { db } from "../app/fconfig";
import { collection, getDocs } from "firebase/firestore";
import { Member } from "../app/types/member";

interface DataFetcherProps {
  onDataFetched: (data: { [key: string]: Member[] }, error: string | null) => void;
  refreshTrigger: number;
}

export default function DataFetcher({ onDataFetched, refreshTrigger }: DataFetcherProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const collections = ["consult", "gym", "karate", "personalTraining", "registrations", "videos", "aerobics"];
      const allMembers: { [key: string]: Member[] } = {
        consult: [],
        gym: [],
        karate: [],
        personalTraining: [],
        registrations: [],
        videos: [],
        aerobics: [],
      };

      await Promise.all(
        collections.map(async (collectionName) => {
          try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const memberData = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                birthDate: data.birthDate || "",
                bloodType: data.bloodType || "",
                breakfastFrequency: data.breakfastFrequency || "",
                city: data.city || "",
                createdAt: data.createdAt || { seconds: 0, nanoseconds: 0 },
                eatingReasons: data.eatingReasons || [],
                email: data.email || "",
                emergencyName: data.emergencyName || "",
                emergencyPhone: data.emergencyPhone || "",
                exerciseDays: data.exerciseDays || [],
                exerciseDuration: data.exerciseDuration || "",
                exercisePain: data.exercisePain || false,
                exerciseTime: data.exerciseTime || "",
                firstName: data.firstName || "",
                foodTracking: data.foodTracking || false,
                goalWeight: data.goalWeight || "",
                healthIssues: data.healthIssues || "",
                height: data.height || "",
                lastName: data.lastName || "",
                medications: data.medications || "",
                membershipType: data.membershipType || "",
                nightEating: data.nightEating || "",
                nutritionRating: data.nutritionRating || "",
                password: data.password || "",
                phoneNumber: data.phoneNumber || "",
                proSport: data.proSport || false,
                role: data.role || "",
                signature: data.signature || "",
                smoke: data.smoke || false,
                startMonth: data.startMonth || "",
                state: data.state || "",
                streetAddress: data.streetAddress || "",
                streetAddress2: data.streetAddress2 || "",
                supplements: data.supplements || false,
                surgery: data.surgery || false,
                trainingGoals: data.trainingGoals || [],
                userId: data.userId || "",
                weight: data.weight || "",
                zipCode: data.zipCode || "",
                collectionType: collectionName,
                name: data.name || undefined,
                membership: data.membership || undefined,
                status: data.status || undefined,
                statusColor: data.statusColor || undefined,
                ...data,
              };
            });
            allMembers[collectionName] = memberData;
          } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
            allMembers[collectionName] = [];
          }
        })
      );

      onDataFetched(allMembers, null);
    } catch (error) {
      console.error("Error fetching members:", error);
      setFetchError("Failed to fetch members. Please try again.");
      onDataFetched({}, "Failed to fetch members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger]);

  return null; // This component doesn't render anything
}