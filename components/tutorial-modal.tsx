"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, User, Briefcase, ArrowRight } from "lucide-react";
import ViewModeToggle from "./view-mode-toggle";
import { APP_CONFIG } from "@/constant/app.config";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("tutorial");
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("welcome", { appName: APP_CONFIG.name })}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t("switchViews")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.rich("description", { b: (chunks) => <strong>{chunks}</strong> })}
              </p>

              <div className="flex justify-center mb-4">
                <ViewModeToggle />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                  <div className="p-2 bg-brand rounded-lg mt-0.5">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{t("employerMode.title")}</h4>
                    <p className="text-sm text-gray-600">
                      {t("employerMode.desc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                  <div className="p-2 bg-brand rounded-lg mt-0.5">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{t("providerMode.title")}</h4>
                    <p className="text-sm text-gray-600">
                      {t("providerMode.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-brand text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-brand-strong transition-colors"
              >
                {t("gotIt")}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialModal;
