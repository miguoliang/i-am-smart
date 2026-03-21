import { headers } from "next/headers";
import { getDeploymentSurfaceFromHeaders } from "@/lib/runtimeDeployment";
import { SignInPageClient } from "./SignInPageClient";

export default async function SignInPage() {
  const h = await headers();
  const deploymentSurface = getDeploymentSurfaceFromHeaders((name) => h.get(name));

  return <SignInPageClient deploymentSurface={deploymentSurface} />;
}
