import type { Thing, WithContext } from "schema-dts";

interface StructuredDataProps {
  data: WithContext<Thing>;
}

function serializeJsonLd(data: WithContext<Thing>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
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
        __html: serializeJsonLd(data),
      }}
    />
  );
}
