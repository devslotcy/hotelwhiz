export interface KBTemplate {
  question: string;
  category: string;
  placeholder: string;
}

export const KB_TEMPLATES: KBTemplate[] = [
  {
    question: "What are the check-in and check-out times?",
    category: "policies",
    placeholder: "e.g. Check-in: 2:00 PM, Check-out: 12:00 PM. Early check-in available upon request.",
  },
  {
    question: "Is breakfast included? What type?",
    category: "meals",
    placeholder: "e.g. Yes, buffet breakfast included daily from 7:00-10:30 AM. Thai and international options.",
  },
  {
    question: "Do you have a swimming pool?",
    category: "facilities",
    placeholder: "e.g. Yes, we have a rooftop infinity pool open 7 AM - 9 PM with ocean views.",
  },
  {
    question: "Is there airport transfer service? What's the price?",
    category: "services",
    placeholder: "e.g. Yes, private airport transfer 800 THB one way. Takes about 45 minutes from Phuket Airport.",
  },
  {
    question: "What are the room rates?",
    category: "pricing",
    placeholder: "e.g. Deluxe Room from 2,500 THB/night, Suite from 4,500 THB/night. Seasonal rates may vary.",
  },
  {
    question: "Is WiFi available? Is it free?",
    category: "facilities",
    placeholder: "e.g. Yes, complimentary high-speed WiFi in all rooms and common areas.",
  },
  {
    question: "Is there parking available?",
    category: "facilities",
    placeholder: "e.g. Yes, free parking for guests. Valet parking also available.",
  },
  {
    question: "Do you accept pets?",
    category: "policies",
    placeholder: "e.g. Unfortunately, we do not allow pets. Service animals are welcome.",
  },
  {
    question: "What dining options are available?",
    category: "meals",
    placeholder: "e.g. On-site Thai restaurant, pool bar, 24h room service. Many restaurants within walking distance.",
  },
  {
    question: "How far is the beach?",
    category: "location",
    placeholder: "e.g. Direct beach access, just 30 meters from the lobby. Beach chairs and towels provided.",
  },
  {
    question: "How far is Phuket town center?",
    category: "location",
    placeholder: "e.g. 15 minutes by car. We offer a free shuttle to Jungceylon Mall twice daily.",
  },
  {
    question: "What extra services do you offer (spa, tours)?",
    category: "services",
    placeholder: "e.g. Full-service spa, island tour booking, snorkeling trips, Thai cooking classes.",
  },
  {
    question: "Is there a gym or fitness center?",
    category: "facilities",
    placeholder: "e.g. Yes, 24-hour fitness center with modern equipment. Yoga classes available on request.",
  },
  {
    question: "What is the cancellation policy?",
    category: "policies",
    placeholder: "e.g. Free cancellation up to 48 hours before check-in. Late cancellation: 1 night charge.",
  },
  {
    question: "Do you offer laundry service?",
    category: "services",
    placeholder: "e.g. Yes, same-day laundry and dry cleaning available. Price list in each room.",
  },
];

export const KB_CATEGORIES: Record<string, string> = {
  policies: "Policies",
  meals: "Food & Dining",
  facilities: "Facilities",
  services: "Services",
  pricing: "Pricing",
  location: "Location",
};
