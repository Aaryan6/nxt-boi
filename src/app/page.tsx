"use client";

import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AnswerOption {
  id: string;
  text: string;
}

const data = {
  question: "What is the capital of France?",
  correctAnswer: "Paris",
  options: [
    { id: "1", text: "Paris" },
    { id: "2", text: "London" },
    { id: "3", text: "Berlin" },
    { id: "4", text: "Madrid" },
  ],
};

// Custom hook to determine the appropriate backend
const useBackend = () => {
  const [backend, setBackend] = useState(() => HTML5Backend);

  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    if (checkTouchDevice()) {
      setBackend(() => TouchBackend);
    }
  }, []);

  return backend;
};

// Wrapper component for DndProvider
const DndProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const backend = useBackend();

  return <DndProvider backend={backend}>{children}</DndProvider>;
};

export default function Home() {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [droppedAnswer, setDroppedAnswer] = useState<string | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  useEffect(() => {
    setIsCorrect(null);
    setDroppedAnswer(null);
    setShowCorrectAnswer(false);
  }, []);

  const handleDrop = (item: AnswerOption) => {
    const correct = item.text === data.correctAnswer;
    setDroppedAnswer(item.text);
    setIsCorrect(correct);
    setShowCorrectAnswer(true);
  };

  const speakWord = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <DndProviderWrapper>
      <Card className="w-full max-w-lg">
        <CardContent className="w-full p-6">
          <div className="mb-4 flex w-full items-center justify-between">
            <span className="text-lg text-gray-600">Question 1 of 10</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => speakWord(data.question)}
              className="rounded-full"
            >
              <Volume2 className="h-4 w-4" />
              <span className="sr-only">Pronounce question</span>
            </Button>
          </div>
          <div className="mb-6 text-center text-2xl font-bold">
            {data.question}
          </div>
          <DropZone
            onDrop={handleDrop}
            isCorrect={isCorrect}
            droppedAnswer={droppedAnswer}
          />
          <div className="mt-6 grid grid-cols-2 gap-4">
            {data.options && data.options.length > 0 ? (
              data.options.map((option) => (
                <DraggableAnswer
                  key={option.id}
                  id={option.id}
                  text={option.text}
                  isCorrect={
                    showCorrectAnswer && option.text === data.correctAnswer
                  }
                />
              ))
            ) : (
              <p>No options available</p>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => {}} disabled={false}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => {}}
              disabled={!droppedAnswer}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </DndProviderWrapper>
  );
}

const DraggableAnswer = ({
  id,
  text,
  isCorrect,
}: AnswerOption & { isCorrect: boolean }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: "answer",
    item: { id, text },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drag(ref);
    dragPreview(ref);
  }, [drag, dragPreview]);

  return (
    <div
      ref={ref}
      className={`cursor-move rounded-lg p-3 font-medium shadow-sm transition-all ${
        isDragging ? "scale-105 opacity-50" : "opacity-100"
      } ${isCorrect ? "bg-green-200" : "border bg-orange-100"}`}
      aria-label={`Drag answer: ${text}`}
    >
      {text}
    </div>
  );
};

const DropZone = ({
  onDrop,
  isCorrect,
  droppedAnswer,
}: {
  onDrop: (item: AnswerOption) => void;
  isCorrect: boolean | null;
  droppedAnswer: string | null;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "answer",
    drop: (item: AnswerOption) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drop(ref);
  }, [drop]);

  let bgColor = "bg-gray-200";
  if (isCorrect === true) bgColor = "bg-green-200";
  if (isCorrect === false) bgColor = "bg-red-200";

  return (
    <div
      ref={ref}
      className={`h-24 w-full ${bgColor} flex flex-col items-center justify-center rounded-lg bg-orange-50 ${
        isOver
          ? "border-4 border-orange-200"
          : "border-4 border-dashed border-orange-200"
      } transition-all duration-300`}
      aria-label="Drop answer here"
    >
      {droppedAnswer ? (
        <>
          <div className="mb-2 text-xl font-bold">{droppedAnswer}</div>
          <div className="text-sm">
            {isCorrect === true && "✅ Correct!"}
            {isCorrect === false && "❌ Incorrect. Try again!"}
          </div>
        </>
      ) : (
        <p className="text-xl font-bold text-orange-500/50">
          Drop your answer here
        </p>
      )}
    </div>
  );
};
