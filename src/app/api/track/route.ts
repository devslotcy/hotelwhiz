import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatMonth } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { slug, messageId } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const hotel = await prisma.hotel.findUnique({ where: { slug } });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Update WA redirect count
    const month = formatMonth();
    await prisma.usage.upsert({
      where: { hotelId_month: { hotelId: hotel.id, month } },
      update: { waRedirectCount: { increment: 1 } },
      create: {
        hotelId: hotel.id,
        month,
        messageCount: 0,
        waRedirectCount: 1,
      },
    });

    // Mark message as clicked if messageId provided
    if (messageId) {
      await prisma.message.updateMany({
        where: {
          id: messageId,
          conversation: { hotelId: hotel.id },
        },
        data: { waClicked: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Track error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
