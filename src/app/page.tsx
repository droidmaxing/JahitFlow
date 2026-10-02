import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await prisma.businessMembership.findFirst({
    where: { userId: session.user.id, business: { active: true } },
    orderBy: { createdAt: "asc" },
    select: { business: { select: { slug: true } } },
  });
  if (!membership) redirect("/login");
  redirect(`/dashboard/${membership.business.slug}`);
}
