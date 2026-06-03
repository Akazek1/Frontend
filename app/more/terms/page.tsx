import BackButtonHeader from "@/components/header/back-button-header";
import { Separator } from "@/components/ui/separator";
import { TermsAndConditionsData } from "@/constant";

const TermsAndConditions = () => {
  return (
    <div className="app-bg p-4 sm:p-5 pb-16 space-y-6 font-urbanist">
      {/* Header */}
      <BackButtonHeader text="Terms & Conditions" />
      <Separator />

      {/* Introduction */}
      <div className="space-y-4 mb-6">
        <p className="text-[#424242] font-normal text-sm tracking-[0.2px] font-urbanist">
          Last Updated: May 2026
        </p>
        <p className="text-[#424242] font-normal text-sm tracking-[0.2px] font-urbanist">
          These Terms & Conditions govern your use of Akazek and the services provided through our platform. By accessing and using Akazek, you agree to comply with these terms. If you do not agree, please do not use our services.
        </p>
      </div>

      <Separator />

      {/* Terms Sections */}
      <div className="space-y-8">
        {TermsAndConditionsData.map((section) => (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xl leading-6 font-bold text-[#212121] font-urbanist">
              {section.id}. {section.title}
            </h2>
            <p className="text-[#424242] font-normal text-sm tracking-[0.2px] font-urbanist leading-relaxed">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {/* Footer */}
      <Separator />
      <div className="space-y-4 pt-4">
        <p className="text-[#424242] font-normal text-xs tracking-[0.2px] font-urbanist">
          <strong>Last Reviewed:</strong> May 13, 2026
        </p>
        <p className="text-[#424242] font-normal text-xs tracking-[0.2px] font-urbanist">
          For questions about these terms, contact: support@akazek.rw
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions;
