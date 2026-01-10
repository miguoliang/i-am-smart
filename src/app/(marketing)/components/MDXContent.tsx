import { MDXRemote } from "next-mdx-remote/rsc";
import { MDXComponents } from "./MDXComponents";

interface MDXContentProps {
  source: string;
}

export function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <MDXRemote source={source} components={MDXComponents} />
    </div>
  );
}
