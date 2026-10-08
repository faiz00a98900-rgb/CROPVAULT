"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/providers/store";

export default function Home() {
  const router = useRouter();
  const { user, ready } = useStore();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [ready, user, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-base text-2xl font-black text-leaf-dark shadow-neu">
          CV
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-base-deep border-t-leaf" />
      </div>
    </div>
  );
}
