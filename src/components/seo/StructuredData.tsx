import type { Thing, WithContext } from "schema-dts";

interface StructuredDataProps {
  data: WithContext<Thing>;
}

/**
 * Reusable component for injecting JSON-LD structured data
 * Used for SEO purposes (Organization, Website, Article, etc.)
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
