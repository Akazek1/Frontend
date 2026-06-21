"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Check, ChevronDown, Mail, Phone, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  AppButton,
  AppSectionHeader,
  Card,
  PageShell,
  appActionCardClass,
  appContentClass,
} from "@/components/ui/app-primitives";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const HelpAndSupport = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "How do I create an account?",
      answer:
        "Download the Akazek app or visit our website. Tap 'Register' and enter your phone number. You'll receive an OTP (one-time password) via SMS. Enter the OTP, then complete your profile with your name, email, and photo. That's it! You're ready to start.",
    },
    {
      id: 2,
      question: "How do I hire a service worker?",
      answer:
        "Browse services in the 'Home' section, filter by category and location, and tap on a service. Review the worker's profile, completed jobs, would-hire-again feedback, and availability. Tap 'Book Now', select your preferred date and time, enter your address, and confirm payment. The worker will receive your booking request.",
    },
    {
      id: 3,
      question: "How do I list my services as a worker?",
      answer:
        "Go to 'Profile' → 'My Services'. Use 'Add New Service Card' to add the service title, description, category, price, service area, and photo. Preview the card, then save it when it looks right.",
    },
    {
      id: 4,
      question: "How is my payment processed?",
      answer:
        "Payments are secured through our payment processor. When you book a service, you provide payment information which is encrypted and processed securely. Funds are held until the service is completed. Workers receive payment after the booking is marked as completed. We recommend reviewing invoices in your transaction history.",
    },
    {
      id: 5,
      question: "How do I cancel or reschedule a booking?",
      answer:
        "Open your booking in 'Bookings' section, tap the booking, and select 'Cancel' or contact the worker directly through messages. We recommend canceling at least 24 hours in advance to avoid fees. For rescheduling, it's best to cancel and create a new booking with your preferred date and time.",
    },
    {
      id: 6,
      question: "How does worker verification work?",
      answer:
        "Workers must verify their identity by uploading a government-issued ID (national ID, passport, or driver's license). Our team reviews the documents to confirm identity. Once verified, workers receive a 'Verified' badge on their profile, helping employers trust their service.",
    },
    {
      id: 7,
      question: "What happens if a worker doesn't show up?",
      answer:
        "If a worker misses the appointment, immediately contact them through the app. If they don't respond, contact our support team at support@akazek.rw with details. We can help resolve the issue, offer a refund, or connect you with another worker. Repeated no-shows by workers may result in account suspension.",
    },
    {
      id: 8,
      question: "How do I leave a review?",
      answer:
        "After a booking is completed, you'll be prompted to share whether you would hire or work with the person again, plus an optional comment about professionalism, punctuality, and quality of work. Reviews help build trust in the community and help other users make informed decisions.",
    },
    {
      id: 9,
      question: "Can I report unsafe or inappropriate behavior?",
      answer:
        "Yes. Go to 'Profile' → 'Report Issue'. Describe the incident, include details (date, time, booking ID), and add any relevant messages or photos. Our safety team will review and take appropriate action. Your report helps keep the Akazek community safe.",
    },
    {
      id: 10,
      question: "How do I switch between Employer and Worker modes?",
      answer:
        "You can be both an employer and a worker! A toggle at the top of the Home page lets you switch views. As an Employer, you see available services. As a Worker (Provider), you see job opportunities. Both roles share the same account.",
    },
    {
      id: 11,
      question: "What payment methods are accepted?",
      answer:
        "Akazek accepts mobile money (MTN Mobile Money, Airtel Money) and bank transfers. All payments are securely processed. Your payment information is encrypted and never shared with workers.",
    },
    {
      id: 12,
      question: "How do I edit or delete a service listing?",
      answer:
        "Go to 'Profile' → 'My Services'. Find your card in 'Your Services', tap the pencil icon to edit or the trash icon to delete. Changes take effect immediately.",
    },
    {
      id: 13,
      question: "What if I forget my password?",
      answer:
        "Akazek uses phone-based login (OTP), not traditional passwords. If you change your phone number, you'll need to register a new account with the new number. For account recovery issues, contact support@akazek.rw.",
    },
    {
      id: 14,
      question: "Is my personal information safe?",
      answer:
        "Yes. Akazek uses industry-standard encryption to protect your data. We never sell your information. Payment details are processed by secure third-party providers. See our Privacy Policy for full details on how we protect your data.",
    },
    {
      id: 15,
      question: "How do I delete my account?",
      answer:
        "Contact support@akazek.rw with your account details. We'll process your deletion request within 30 days. Note that deleting your account is permanent and cannot be undone. All your services, bookings, and reviews will be removed.",
    },
  ];

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <PageShell className="gap-5 font-urbanist">
      <BackButtonHeader text="Help & Support" />

      {/* Contact Support Section */}
      <Card className="space-y-4">
        <AppSectionHeader title="Need Help?" />
        <p className="text-sm text-gray-600">
          Can&apos;t find the answer you&apos;re looking for? Our support team is here to help!
        </p>
        <div className="space-y-3 flex flex-col">
          <AppButton asChild className="w-full">
            <a href="mailto:support@akazek.rw">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </AppButton>
          <div className="text-center text-sm text-gray-600">
            <p>support@akazek.rw</p>
            <p className="text-xs text-gray-500 mt-1">Typically respond within 24-48 hours</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-[#EDF1EC] pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Phone className="h-4 w-4 text-brand" />
            Phone Support
          </p>
          <a
            href="tel:+250788000000"
            className="text-brand font-semibold hover:underline"
          >
            +250 788 000 000
          </a>
          <p className="text-xs text-gray-500">Available Mon-Fri, 8am-6pm EAT</p>
        </div>

        <div className="space-y-2 border-t border-[#EDF1EC] pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Send className="h-4 w-4 text-brand" />
            WhatsApp Support
          </p>
          <a
            href="https://wa.me/250788000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold hover:underline inline-flex items-center gap-1"
          >
            Chat with us
          </a>
          <p className="text-xs text-gray-500">Quick responses to your questions</p>
        </div>
      </Card>

      {/* FAQ Section */}
      <section className={appContentClass}>
        <AppSectionHeader title="Frequently Asked Questions" />
        <div className="space-y-3">
          {faqData.map((item) => (
            <Card
              variant="list"
              key={item.id}
              className="overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(item.id)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                    expandedFAQ === item.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedFAQ === item.id && (
                <div className="border-t border-[#EDF1EC] bg-gray-50 px-4 py-4">
                  <p className="text-sm leading-relaxed text-gray-700">{item.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Resources */}
      <Card className="space-y-4">
        <AppSectionHeader title="Additional Resources" />
        <div className="space-y-3">
          <Link
            href="/more/privacy"
            className={cn(appActionCardClass, "block px-4 py-3 shadow-none")}
          >
            <p className="font-semibold text-gray-900 text-sm">Privacy Policy</p>
            <p className="text-xs text-gray-600 mt-1">How we protect your personal information</p>
          </Link>
          <Link
            href="/more/terms"
            className={cn(appActionCardClass, "block px-4 py-3 shadow-none")}
          >
            <p className="font-semibold text-gray-900 text-sm">Terms & Conditions</p>
            <p className="text-xs text-gray-600 mt-1">Our terms of service and user agreement</p>
          </Link>
          <Link
            href="/more/feedback"
            className={cn(appActionCardClass, "block px-4 py-3 shadow-none")}
          >
            <p className="font-semibold text-gray-900 text-sm">Send Feedback</p>
            <p className="text-xs text-gray-600 mt-1">Tell us how we can improve Akazek</p>
          </Link>
        </div>
      </Card>

      {/* Tips Section */}
      <Card className="space-y-4 border-[#BFD8FF] bg-[#EEF6FF]">
        <h3 className="flex items-center gap-2 text-base font-bold text-blue-900">
          <Sparkles className="h-4 w-4" />
          Pro Tips
        </h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Always verify worker credentials before booking</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Communicate details clearly in messages before the appointment</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Complete bookings and leave reviews to build community trust</span>
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Use safe public locations for first-time meetings</span>
          </li>
        </ul>
      </Card>
    </PageShell>
  );
};

export default HelpAndSupport;
