"use client";

import { useSocket, NewMessageEvent } from "@/lib/useSocket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RealtimeProviderProps {
  hotelId: string;
  hotelSlug: string;
  children: React.ReactNode;
}

export function RealtimeProvider({ hotelId, hotelSlug, children }: RealtimeProviderProps) {
  const router = useRouter();

  useSocket(hotelId, (data: NewMessageEvent) => {
    // Truncate long messages for toast display
    const preview = data.message.length > 60
      ? data.message.slice(0, 60) + "..."
      : data.message;

    toast("Yeni misafir mesajı!", {
      description: `"${preview}"`,
      duration: 8000,
      action: {
        label: "Görüntüle",
        onClick: () => {
          router.push(`/dashboard/${hotelSlug}/conversations/${data.sessionId}`);
        },
      },
    });

    // Refresh server components to update counts
    router.refresh();
  });

  return <>{children}</>;
}
