import BackButtonHeader from "@/components/header/back-button-header";
import { TermsAndConditionsData } from "@/constant";
import { Card, PageShell, appContentClass } from "@/components/ui/app-primitives";

const TermsAndConditions = () => {
  return (
    <PageShell className="gap-5 font-urbanist">
      <BackButtonHeader text="Terms & Conditions" />

      {/* Introduction */}
      <Card className="space-y-4">
        <p className="text-[#424242] font-normal text-sm tracking-[0.2px] font-urbanist">
          Last Updated: May 2026
        </p>
        <p className="text-[#424242] font-normal text-sm tracking-[0.2px] font-urbanist">
          These Terms & Conditions govern your use of Akazek and the services provided through our platform. By accessing and using Akazek, you agree to comply with these terms. If you do not agree, please do not use our services.
        </p>
      </Card>

      {/* Terms Sections */}
      <div className={`${appContentClass} gap-8`}>
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
      <Card className="space-y-4">
        <p className="text-[#424242] font-normal text-xs tracking-[0.2px] font-urbanist">
          <strong>Last Reviewed:</strong> May 13, 2026
        </p>
        <p className="text-[#424242] font-normal text-xs tracking-[0.2px] font-urbanist">
          For questions about these terms, contact: support@akazek.rw
        </p>
      </Card>
    </PageShell>
  );
};

export default TermsAndConditions;
