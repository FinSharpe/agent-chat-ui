import { Badge } from "@/components/ui/badge";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useBookmarkedThreads } from "../hooks/useBookmarkedThreads";
import ThreadCard from "./ThreadCard";

export default function BookmarkedChatsSlider() {
  const [sliderIndex, setSliderIndex] = useState(0);
  const { bookmarkedThreads: threads } = useBookmarkedThreads();

  useEffect(() => {
    if (sliderIndex >= threads.length && threads.length > 0) {
      setSliderIndex(threads.length - 1);
    } else if (threads.length === 0) {
      setSliderIndex(0);
    }
  }, [threads.length, sliderIndex]);

  const handleNext = () => {
    if (sliderIndex < threads.length - 1) {
      setSliderIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (sliderIndex > 0) {
      setSliderIndex((prev) => prev - 1);
    }
  };

  if (threads.length === 0) return null;

  return (
    <div className="mb-6 min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-yellow-500" />
          <h4 className="font-medium text-gray-900">Bookmarked Chats</h4>
          <Badge className="border-yellow-200 bg-yellow-50 text-xs text-yellow-700 hover:bg-yellow-50">
            {threads.length}
          </Badge>
        </div>
        {threads.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={sliderIndex === 0}
              className="rounded-full p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="mx-2 text-xs text-gray-500">
              {sliderIndex + 1} / {threads.length}
            </span>
            <button
              onClick={handleNext}
              disabled={sliderIndex === threads.length - 1}
              className="rounded-full p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${sliderIndex * 100}%)`,
          }}
        >
          {threads.map((thread) => (
            <div
              key={thread.thread_id}
              className="w-full flex-shrink-0"
            >
              <ThreadCard thread={thread} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
