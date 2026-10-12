import type { Metadata } from "next";
import StarterPackIntake from "./StarterPackIntake";
import { isAuthConfigured } from "@/app/lib/auth-config";

export const metadata: Metadata = {
  title: "Free Starter Pack | Gorilla Mentality",
  description:
    "Build a free Gorilla Mentality training routine and meal guide from a quick goal, training, and basic details intake.",
};

export default function StarterPackPage() {
  return <StarterPackIntake authEnabled={isAuthConfigured()} />;
}
