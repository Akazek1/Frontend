"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Star, Loader2 } from "lucide-react";
import { Inter } from "next/font/google";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  PageShell,
  appContentClass,
  appPrimaryButtonClass,
  appTextareaClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error-handler";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const Feedback = () => {
  const [rating, setRating] = useState<number | null>(null); 
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); 

  // Handle star click to set the rating
  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1); 
  };

  // Handle textarea change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        message: message.trim() || undefined, 
      };

      await api.post("/feedback", payload);
      toast.success("Thanks for your valuable feedback!");
      setRating(null); 
      setMessage(""); 
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error(getApiErrorMessage(err, "Failed to submit feedback"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell className={cn("gap-5", inter.className)}>
      {/* Header */}
      <BackButtonHeader text="Share Feedback" />
      <div className={cn(appContentClass, "cursor-pointer gap-5")}>
        <h1 className="text-[#212121] text-xl font-medium leading-6 pr-6">
          How would you rate the app experience?
        </h1>
        <div className="flex items-center gap-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`w-7 h-7 stroke-1 ${rating && index < rating
                  ? "fill-[#F5C443] stroke-[#F5C443]"
                  : "stroke-[#9E9E9E]"
                }`}
              onClick={() => handleStarClick(index)}
            />
          ))}
        </div>
        <Textarea
          className={cn(appTextareaClass, "min-h-[140px]")}
          placeholder="Type in your feedback"
          rows={6}
          value={message}
          onChange={handleMessageChange}
        />
        <Button
          onClick={handleSubmit}
          className={cn(appPrimaryButtonClass, "w-full font-urbanist text-base")}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </PageShell>
  );
};

export default Feedback;
