import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/site/home-page";
import { createHomeHead } from "@/lib/seo";

export const Route = createFileRoute("/en")({
  staticData: { sitemap: true },
  head: () => createHomeHead("en"),
  component: () => <HomePage locale="en" />,
});
