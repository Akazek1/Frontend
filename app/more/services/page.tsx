"use client";

import React, { useState } from "react";
import { SquarePlus } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import IndividualForm from "@/components/get-hired/individual-form";
import AgencyWorkerForm from "@/components/get-hired/agency-worker-form";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { isEmployer } from "@/lib/roles";

const MyServicesPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userIsEmployer = isEmployer(user?.roles);
  const [showWorkerForm, setShowWorkerForm] = useState(false);

  return (
    <div className="pb-10">
      <div className="p-4 sm:p-6 flex items-center justify-between">
        <BackButtonHeader text="My Services" backHref="/more" />
        {userIsEmployer && (
          <button
            type="button"
            onClick={() => setShowWorkerForm((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#145B10] text-[#145B10]"
            aria-label={showWorkerForm ? "Back to service cards" : "Add worker"}
          >
            <SquarePlus className="h-5 w-5" />
          </button>
        )}
      </div>

      {showWorkerForm ? (
        <div className="px-4 sm:px-6">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-[#1B2431]">Add Worker</h1>
            <p className="mt-1 text-sm text-[#616161]">
              Add a worker first, then create service cards for the services they offer.
            </p>
          </div>
          <AgencyWorkerForm />
        </div>
      ) : (
        <div className="px-4 sm:px-6 space-y-5">
          <div className="rounded-xl border border-[#DCEEDD] bg-white p-4">
            <h1 className="text-xl font-bold text-[#1B2431]">Add New Service Card</h1>
            <p className="mt-1 text-sm text-[#616161]">
              Build the card employers will see, preview it, then save when it looks right.
            </p>
          </div>

          <IndividualForm isWorker={userIsEmployer} />
        </div>
      )}
    </div>
  );
};

export default MyServicesPage;
