"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Check, ChevronDown, Mail, Phone, Send } from "lucide-react";
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
        "Open Akazek and enter your phone number. You'll receive a 6-digit code by SMS — enter it to verify, then add your name and date of birth to finish onboarding. Email is optional and can be added later from your profile. There's no password to set or remember.",
    },
    {
      id: 2,
      question: "How do I hire a service worker?",
      answer:
        "On the Home tab, make sure 'Hire help' is selected at the top, then browse or search for a service and filter by category and location. Open a worker's service to review their profile, completed jobs, and would-hire-again feedback, then tap 'Request to Hire', add a short note about what you need, and send it. The worker gets your request and can accept it from their side.",
    },
    {
      id: 3,
      question: "What's the difference between 'Request to Hire' and 'Contact Agency'?",
      answer:
        "Most workers can be hired directly with 'Request to Hire'. Some workers are placed by a staffing agency instead — their service shows 'Contact Agency' rather than a direct request. Tap it, describe what you need, and the agency will review your note and reach out to discuss placing a worker with you.",
    },
    {
      id: 4,
      question: "How do I list my services as a worker?",
      answer:
        "Switch to 'Find work' mode at the top of the Home tab, then go to More → My Services and tap 'Add Service'. Fill in the category, description, price, service area, and a photo, then save — it'll appear on your profile for employers to find.",
    },
    {
      id: 5,
      question: "How is payment handled?",
      answer:
        "Akazek doesn't process payment in the app — hiring requests and messaging are free to use. Agree on price and scope with the worker in chat before the job starts, and pay them directly once it's done.",
    },
    {
      id: 6,
      question: "How do I cancel a booking?",
      answer:
        "Open your conversation with the worker for that job — you'll find a 'Cancel Job' option in the task panel there. If the request is still pending, you can also accept or decline it straight from the Work tab. There's no reschedule option yet, so if you need a different date, cancel and send a new request.",
    },
    {
      id: 7,
      question: "How does worker verification work?",
      answer:
        "Workers can upload a government-issued ID from their profile for review. Once our team approves it, a 'Verified' badge appears on their profile and service listings, so employers can hire with more confidence.",
    },
    {
      id: 8,
      question: "What happens if a worker doesn't show up?",
      answer:
        "Message them directly in the app first. If they don't respond, go to More → Report an Issue, describe what happened, and our team will review it and follow up.",
    },
    {
      id: 9,
      question: "How do I leave a review?",
      answer:
        "After a booking is marked complete, you'll be asked whether you'd hire (or work with) that person again — Yes, Maybe, or No — plus an optional comment. That would-hire-again feedback is what shows on a profile; there's no separate star rating.",
    },
    {
      id: 10,
      question: "Can I report unsafe or inappropriate behavior?",
      answer:
        "Yes. Go to More → Report an Issue (also reachable from a booking's task panel), choose a category, and describe what happened. Our safety team reviews every report.",
    },
    {
      id: 11,
      question: "How do I switch between Employer and Worker modes?",
      answer:
        "At the top of the Home tab there are two buttons — 'Hire help' and 'Find work'. Tap between them any time; both roles live on the same account, so there's no need for a second sign-up.",
    },
    {
      id: 12,
      question: "How do I edit or delete a service listing?",
      answer:
        "Go to More → My Services, find the listing you want to change, and tap the pencil icon to edit or the trash icon to delete. Changes apply right away.",
    },
    {
      id: 13,
      question: "What if I can't sign in / forget my password?",
      answer:
        "Akazek doesn't use passwords — you always sign in with your phone number and a fresh SMS code. If you've changed your phone number, contact support@akazek.rw; registering with a new number on its own would create a separate account.",
    },
    {
      id: 14,
      question: "Is my personal information safe?",
      answer:
        "Yes. We use industry-standard encryption to protect your data and never sell it. Documents like your ID are only used for verification. See our Privacy Policy for full details.",
    },
    {
      id: 15,
      question: "How do I delete my account?",
      answer:
        "There's no in-app delete option yet — email support@akazek.rw with your account details and we'll process the deletion within 30 days. This is permanent: your services, bookings, and reviews will all be removed.",
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
        <h3 className="text-base font-bold text-blue-900">
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
