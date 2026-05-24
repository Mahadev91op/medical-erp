"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </SessionProvider>
  );
}