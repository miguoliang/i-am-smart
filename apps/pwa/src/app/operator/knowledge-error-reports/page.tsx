import { redirect } from "next/navigation";

export default function KnowledgeErrorReportsRedirectPage() {
  redirect("/operator/knowledges?pending=1");
}
