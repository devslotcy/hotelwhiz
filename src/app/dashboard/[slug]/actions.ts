"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { KB_TEMPLATES } from "@/lib/kb-templates";

async function getAuthorizedHotel(slug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const hotel = await prisma.hotel.findUnique({ where: { slug } });
  if (!hotel || hotel.ownerId !== session.user.id) throw new Error("Not found");

  return hotel;
}

// Seed KB templates for a hotel
export async function seedKBTemplates(slug: string) {
  const hotel = await getAuthorizedHotel(slug);

  const existing = await prisma.knowledgeBase.count({
    where: { hotelId: hotel.id },
  });

  if (existing > 0) return { error: "Templates already loaded" };

  await prisma.knowledgeBase.createMany({
    data: KB_TEMPLATES.map((t, i) => ({
      hotelId: hotel.id,
      question: t.question,
      answer: "",
      category: t.category,
      sortOrder: i,
    })),
  });

  revalidatePath(`/dashboard/${slug}`);
  return { success: true, count: KB_TEMPLATES.length };
}

// Create KB entry
export async function createKBEntry(
  slug: string,
  data: { question: string; answer: string; category: string }
) {
  const hotel = await getAuthorizedHotel(slug);

  if (!data.question.trim()) return { error: "Question is required" };

  const maxOrder = await prisma.knowledgeBase.findFirst({
    where: { hotelId: hotel.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.knowledgeBase.create({
    data: {
      hotelId: hotel.id,
      question: data.question.trim(),
      answer: data.answer.trim(),
      category: data.category || "general",
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}

// Update KB entry
export async function updateKBEntry(
  slug: string,
  entryId: string,
  data: { question?: string; answer?: string; category?: string }
) {
  const hotel = await getAuthorizedHotel(slug);

  const entry = await prisma.knowledgeBase.findUnique({
    where: { id: entryId },
  });

  if (!entry || entry.hotelId !== hotel.id) return { error: "Not found" };

  await prisma.knowledgeBase.update({
    where: { id: entryId },
    data: {
      ...(data.question !== undefined && { question: data.question.trim() }),
      ...(data.answer !== undefined && { answer: data.answer.trim() }),
      ...(data.category !== undefined && { category: data.category }),
    },
  });

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}

// Delete KB entry
export async function deleteKBEntry(slug: string, entryId: string) {
  const hotel = await getAuthorizedHotel(slug);

  const entry = await prisma.knowledgeBase.findUnique({
    where: { id: entryId },
  });

  if (!entry || entry.hotelId !== hotel.id) return { error: "Not found" };

  await prisma.knowledgeBase.delete({ where: { id: entryId } });

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}

// Update hotel details
export async function updateHotel(
  slug: string,
  data: {
    name?: string;
    description?: string;
    whatsappUrl?: string;
    website?: string;
    address?: string;
    phone?: string;
  }
) {
  const hotel = await getAuthorizedHotel(slug);

  await prisma.hotel.update({
    where: { id: hotel.id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && {
        description: data.description.trim() || null,
      }),
      ...(data.whatsappUrl !== undefined && {
        whatsappUrl: data.whatsappUrl.trim(),
      }),
      ...(data.website !== undefined && {
        website: data.website.trim() || null,
      }),
      ...(data.address !== undefined && {
        address: data.address.trim() || null,
      }),
      ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
    },
  });

  revalidatePath(`/dashboard/${slug}`);
  return { success: true };
}
