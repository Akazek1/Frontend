"use client";

import React, { useEffect, useState } from "react";
import { Job } from "@/services/jobs-service";
import jobsService from "@/services/jobs-service";
import { JobCard } from "./job-card";
import { Loader2, Briefcase, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface JobsBrowseProps {
  showMyJobs?: boolean;
}

const JobsBrowse: React.FC<JobsBrowseProps> = ({ showMyJobs = false }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let data;
        if (showMyJobs && userId) {
          data = await jobsService.getMyJobs();
        } else {
          data = await jobsService.getAllJobs();
        }
        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [showMyJobs, userId]);

  // Filter jobs based on search and category
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || job.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(
    new Set(jobs.map(job => job.category.name))
  ).sort();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#145B10]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-black text-[#1B2431]">
            {showMyJobs ? "My Job Postings" : "Browse Jobs"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {showMyJobs
              ? "Manage your job postings and view applicants"
              : "Find the perfect job opportunity"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm placeholder-gray-400 focus:border-[#145B10] focus:outline-none focus:ring-1 focus:ring-[#145B10]"
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                selectedCategory === null
                  ? "bg-[#145B10] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  selectedCategory === category
                    ? "bg-[#145B10] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isOwner={user?.id === job.employerId}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#145B10]/10">
            <Briefcase className="h-8 w-8 text-[#145B10]" />
          </div>
          <h3 className="text-lg font-black text-[#1B2431]">No jobs found</h3>
          <p className="mt-2 max-w-xs text-center text-sm text-gray-500">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Check back soon for new opportunities"}
          </p>
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-sm text-gray-500">
        {filteredJobs.length > 0 && (
          <p>
            Showing {filteredJobs.length} of {jobs.length} job
            {jobs.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default JobsBrowse;
