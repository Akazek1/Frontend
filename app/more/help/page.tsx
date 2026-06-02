"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

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
        "Browse services in the 'Home' section, filter by category and location, and tap on a service. Review the worker's profile, ratings, and availability. Tap 'Book Now', select your preferred date and time, enter your address, and confirm payment. The worker will receive your booking request.",
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
        "After a booking is completed, you'll be prompted to leave a review. Rate the worker's service (1-5 stars) and add comments about their professionalism, punctuality, and quality of work. Reviews help build trust in the community and help other employers make informed decisions.",
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
    <div className="bg-[#F1FCEF] p-4 sm:p-5 pb-16 space-y-6 font-urbanist">
      {/* Header */}
      <BackButtonHeader text="Help & Support" />
      <Separator />

      {/* Contact Support Section */}
      <div className="space-y-4 bg-white rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900">Need Help?</h2>
        <p className="text-sm text-gray-600">
          Can't find the answer you're looking for? Our support team is here to help!
        </p>
        <div className="space-y-3 flex flex-col">
          <a
            href="mailto:support@akazek.rw"
            className="w-full bg-[#145B10] text-white py-3 rounded-lg font-semibold text-center hover:bg-[#1B5E20] transition-colors"
          >
            📧 Email Support
          </a>
          <div className="text-center text-sm text-gray-600">
            <p>support@akazek.rw</p>
            <p className="text-xs text-gray-500 mt-1">Typically respond within 24-48 hours</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">📞 Phone Support</p>
          <a
            href="tel:+250788000000"
            className="text-[#145B10] font-semibold hover:underline"
          >
            +250 788 000 000
          </a>
          <p className="text-xs text-gray-500">Available Mon-Fri, 8am-6pm EAT</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">📱 WhatsApp Support</p>
          <a
            href="https://wa.me/250788000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#145B10] font-semibold hover:underline inline-flex items-center gap-1"
          >
            Chat with us
          </a>
          <p className="text-xs text-gray-500">Quick responses to your questions</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
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
                <>
                  <Separator />
                  <div className="px-4 py-4 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="space-y-4 bg-white rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900">Additional Resources</h3>
        <div className="space-y-3">
          <Link
            href="/more/privacy"
            className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <p className="font-semibold text-gray-900 text-sm">Privacy Policy</p>
            <p className="text-xs text-gray-600 mt-1">How we protect your personal information</p>
          </Link>
          <Link
            href="/more/terms"
            className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <p className="font-semibold text-gray-900 text-sm">Terms & Conditions</p>
            <p className="text-xs text-gray-600 mt-1">Our terms of service and user agreement</p>
          </Link>
          <Link
            href="/more/feedback"
            className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <p className="font-semibold text-gray-900 text-sm">Send Feedback</p>
            <p className="text-xs text-gray-600 mt-1">Tell us how we can improve Akazek</p>
          </Link>
        </div>
      </div>

      {/* Tips Section */}
      <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-base font-bold text-blue-900">💡 Pro Tips</h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li className="flex gap-2">
            <span>✓</span>
            <span>Always verify worker credentials before booking</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Communicate details clearly in messages before the appointment</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Complete bookings and leave reviews to build community trust</span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Use safe public locations for first-time meetings</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HelpAndSupport;
