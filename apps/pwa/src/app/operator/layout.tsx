"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "./components/DashboardLayout";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { useOperatorAuth } from "./hooks/useOperatorAuth";
import { useState } from "react";
import { t } from "@/lib/i18n";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page renders without auth wrapper
  if (pathname === "/operator/login") {
    return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, supabase } = useOperatorAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-3xl font-medium">{t().operator.checkingPermissions}</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
  };

  return (
    <DashboardLayout
      topNav={<TopNav userEmail={user.email || ""} onSignOut={handleSignOut} loading={isSigningOut} />}
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardLayout>
  );
}

