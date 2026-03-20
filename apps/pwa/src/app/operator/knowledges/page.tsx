import { Suspense } from "react";
import { KnowledgesPageClient } from "./KnowledgesPageClient";
import { OperatorMain } from "../components/OperatorChrome";

export default function KnowledgesPage() {
  return (
    <Suspense
      fallback={
        <OperatorMain>
          <p className="text-sm text-muted-foreground">加载中…</p>
        </OperatorMain>
      }
    >
      <KnowledgesPageClient />
    </Suspense>
  );
}
