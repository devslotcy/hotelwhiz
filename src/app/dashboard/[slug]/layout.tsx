import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";

export default async function HotelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { slug } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    select: { id: true, slug: true, ownerId: true },
  });

  if (!hotel || hotel.ownerId !== session.user.id) notFound();

  return (
    <RealtimeProvider hotelId={hotel.id} hotelSlug={hotel.slug}>
      {children}
    </RealtimeProvider>
  );
}
