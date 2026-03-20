"use client";

import { CollapsibleInstructions } from "@/modules/core/common/ui/CollapsibleInstructions";
import {
  CarouselBanner,
  type CarouselSlide,
} from "@/modules/core/common/ui/CarouselBanner";
import { Database } from "lucide-react";
import ThreadHistoryList from "@/modules/history/components/ThreadHistoryList";
import BookmarkedChatsSlider from "@/modules/history/components/BookmarkedChatsSlider";

const memorySlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Memory",
    subtitle: "Resume your previous conversations and access saved insights",
    image: "/banners/records.png",
  },
  {
    id: 2,
    title: "Memory",
    subtitle: "Your complete chat history with tags and smart organization",
    image: "/banners/aesthetic_tablet_white.png",
  },
  {
    id: 3,
    title: "Memory",
    subtitle: "Bookmark important conversations and find them instantly",
    image: "/banners/locker.png",
  },
  {
    id: 4,
    title: "Memory",
    subtitle: "All your research reports and portfolios securely stored",
    image: "/banners/reports.png",
  },
];

export default function page() {
  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6 overflow-hidden p-6 pb-24">
      {/* Carousel Banner */}
      <CarouselBanner slides={memorySlides} />
      {/* What is Memory Section */}
      <CollapsibleInstructions
        title="Long-term Chat Memory"
        description="Your AI assistant remembers everything about previous conversations, saved investment portfolios, research reports, and enables follow-up questions on your chat history."
        icon={Database}
        bgColor="bg-green-50 border-green-200"
        iconBgColor="bg-green-100"
        textColor="text-green-900"
        iconColor="text-green-600"
        defaultExpanded={true}
      />

      <div className="mt-8">
        <div className="space-y-6">
          {/* Bookmarked Chats Slider */}
          <BookmarkedChatsSlider />
        </div>
        <ThreadHistoryList />
      </div>
    </div>
  );
}
