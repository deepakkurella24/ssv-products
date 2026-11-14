import { notFound } from "next/navigation";
import StaticInfoContent from "@/components/StaticInfoContent";
import { COMPANY_LINKS } from "@/lib/site";

export function generateStaticParams() {
  return COMPANY_LINKS.map((link) => ({ page: link.to.slice(1) }));
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const link = COMPANY_LINKS.find((l) => l.to.slice(1) === page);
  if (!link) return { title: "Page not found · SSV" };
  return { title: `${link.label} · SSV` };
}

export default async function StaticInfoPage({ params }) {
  const { page } = await params;
  const link = COMPANY_LINKS.find((l) => l.to.slice(1) === page);
  if (!link) notFound();

  return <StaticInfoContent page={page} title={link.label} />;
}
