import React from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Separator } from "@/components/ui/separator";
import { PrivacyPolicyData } from "@/constant";
import { PageShell, appContentClass } from "@/components/ui/app-primitives";

const PrivacyPolicy = () => {
  return (
    <PageShell className="gap-5 font-urbanist">
      {/* Header */}
      <BackButtonHeader text="Privacy Policy" />
      <Separator />
      <div className={`${appContentClass} gap-8`}>
        {PrivacyPolicyData.map((section) => (
          <section key={section.id} className="space-y-6">
            <h2 className="font-urbanist text-[20px] font-bold leading-6 text-[#212121]">
              {section.id}. {section.title}
            </h2>
            <p className="font-urbanist text-[14px] font-normal leading-6 tracking-[0.2px] text-[#424242]">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
};

export default PrivacyPolicy;
