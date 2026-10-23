"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { obtenerToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(obtenerToken() ? "/inicio" : "/login");
  }, [router]);

  return <p className="p-6">Cargando...</p>;
}