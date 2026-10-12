"use client";

import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import RoutinePreferences from "./RoutinePreferences";

export default function ProfilePage() {
  return (
    <main className="p-4 md:p-8">
      <h1 className="mb-4 text-3xl font-bold">Profile</h1>
      <Link
        href="/starter-pack"
        className="mb-6 inline-block text-yellow-500 underline"
      >
        Update your training and nutrition targets
      </Link>
      <RoutinePreferences />
      <div className="max-w-full overflow-x-auto">
        <UserProfile routing="hash" />
      </div>
    </main>
  );
}
