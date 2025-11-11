"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GoogleCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      router.push("/");
    } else {
      router.push("/login");
    }
  }, [params, router]);

  return <div className="text-white text-center mt-20">Logging in with Google...</div>;
}
