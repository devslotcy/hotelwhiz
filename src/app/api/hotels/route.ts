import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import { KB_TEMPLATES } from "@/lib/kb-templates";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, whatsappUrl, website, address, phone } =
      await req.json();

    if (!name || !whatsappUrl) {
      return NextResponse.json(
        { error: "Hotel name and WhatsApp link are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(name);
    const existing = await prisma.hotel.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const hotel = await prisma.hotel.create({
      data: {
        name,
        slug,
        description: description || null,
        whatsappUrl,
        website: website || null,
        address: address || null,
        phone: phone || null,
        ownerId: session.user.id,
      },
    });

    // Auto-seed KB templates
    await prisma.knowledgeBase.createMany({
      data: KB_TEMPLATES.map((t, i) => ({
        hotelId: hotel.id,
        question: t.question,
        answer: "",
        category: t.category,
        sortOrder: i,
      })),
    });

    return NextResponse.json(
      { message: "Hotel created", slug: hotel.slug, id: hotel.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hotels = await prisma.hotel.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(hotels);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
