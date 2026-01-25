"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radley } from "next/font/google";
import { ChevronLeft, ChevronRight } from "lucide-react";

const radley = Radley({ subsets: ["latin"], weight: "400" });

interface Card {
  id: string;
  caseName: string;
  caseNum: string;
}

interface SwipeCardsProps {
  cards: Card[];
}

export default function SwipeCards({ cards }: SwipeCardsProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedCards, setSwipedCards] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);

  const resetSwipes = () => {
    setSwipedCards(new Set());
    setCurrentIndex(0);
    setDragDelta(0);
  };

  const finishSwipe = (delta: number) => {
    if (Math.abs(delta) > 80) {
      const currentCard = cards[currentIndex];
      setSwipedCards((prev) => new Set(prev).add(currentCard.id));
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setDragDelta(delta);
  };

  const handleMouseUp = (e: React.MouseEvent | TouchEvent) => {
    setIsDragging(false);
    const clientX =
      "changedTouches" in e ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX;
    const delta = clientX - startX;
    finishSwipe(delta);
    setDragDelta(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setStartX(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const delta = touch.clientX - startX;
    setDragDelta(delta);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleMouseUp(e.nativeEvent);
  };

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const allCardsSwiped = cards.length > 0 && swipedCards.size === cards.length;
  const isCompleted = cards.length === 0 || allCardsSwiped;

  const swipeForward = useCallback(() => {
    if (isCompleted) return;
    const currentCard = cards[currentIndex];
    setSwipedCards((prev) => new Set(prev).add(currentCard.id));
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [cards, currentIndex, isCompleted]);

  const triggerButtonSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isCompleted) return;
      const distance = direction === "right" ? 350 : -350;
      setDragDelta(distance);
      setTimeout(() => {
        swipeForward();
        setDragDelta(0);
      }, 140);
    },
    [isCompleted, swipeForward],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        triggerButtonSwipe("right");
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggerButtonSwipe("left");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerButtonSwipe]);

  return (
    <div className="flex flex-col items-center gap-8">
      {isCompleted ? (
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="text-center">
            <h2
              className={`text-5xl font-black text-[#4b1d1d] mb-4 tracking-wide ${radley.className}`}
            >
              ✓ All Done!
            </h2>
            <p className="text-xl text-[#4b1d1d]/70">
              You have completed all action items
            </p>
          </div>
          <button
            onClick={() => {
              resetSwipes();
              router.push("/app");
            }}
            className="bg-[#f0a56b] text-[#4b1d1d] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-amber-400 transition-colors mt-4"
          >
            Completed
          </button>
          <button
            onClick={resetSwipes}
            className="text-sm text-[#4b1d1d] underline hover:text-[#6b2d2d]"
          >
            Swipe again
          </button>
        </div>
      ) : (
        <>
          <div className="w-full max-w-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                {currentIndex + 1} / {cards.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f0a56b] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div ref={containerRef} className="w-full max-w-2xl select-none">
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseLeave={() => {
                if (isDragging) {
                  setIsDragging(false);
                  finishSwipe(dragDelta);
                  setDragDelta(0);
                }
              }}
              className="bg-white rounded-lg shadow-lg border-l-4 border-[#f0a56b] p-8 min-h-80 flex flex-col justify-between transition-transform duration-200"
              style={{
                transform: `translateX(${dragDelta * 1.5}px) rotateZ(${dragDelta * 0.03}deg)`,
                cursor: isDragging ? "grabbing" : "grab",
                opacity: 1 - Math.abs(dragDelta) * 0.001,
              }}
            >
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  CASE #{card.caseNum}
                </p>
                <h2 className="text-4xl font-bold text-[#4b1d1d] mb-6">
                  {card.caseName}
                </h2>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-block bg-[#4b1d1d] text-white px-3 py-1 rounded text-sm">
                    Action Items
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Drag to swipe or use arrows
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => {
                triggerButtonSwipe("left");
              }}
              className="bg-[#4b1d1d] text-white p-3 rounded-lg hover:bg-[#6b2d2d] transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex gap-2">
              {cards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-[#f0a56b] w-8"
                      : "bg-gray-300 w-2"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                triggerButtonSwipe("right");
              }}
              className="bg-[#4b1d1d] text-white p-3 rounded-lg hover:bg-[#6b2d2d] transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
