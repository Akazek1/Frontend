import api from "@/lib/axios";

export interface Job {
  id: string;
  title: string;
  description: string;
  employerId: string;
  categoryId: string;
  addressId?: string;
  budgetMin?: number;
  budgetMax?: number;
  scheduleType?: string;
  startDate?: string;
  endDate?: string;
  status: "OPEN" | "CLOSED" | "AWARDED" | "CANCELLED";
  createdAt: string;
  category: { id: string; name: string };
  address?: { id: string; street: string; city: string };
  employer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  _count?: { applications: number };
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  message?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  job?: Job;
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    isVerified: boolean;
    phoneNumber?: string;
  };
}

const jobsService = {
  createJob: async (data: any) => {
    const response = await api.post("/jobs", data);
    return response.data.data;
  },

  getAllJobs: async (params?: any) => {
    const response = await api.get("/jobs", { params });
    return response.data.data;
  },

  getJobById: async (id: string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data.data;
  },

  updateJob: async (id: string, data: any) => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data.data;
  },

  applyToJob: async (jobId: string, data: { message?: string }) => {
    const response = await api.post(`/jobs/${jobId}/apply`, data);
    return response.data.data;
  },

  getMyJobs: async () => {
    const response = await api.get("/jobs/my-jobs");
    return response.data.data;
  },

  getMyApplications: async () => {
    const response = await api.get("/jobs/my-applications");
    return response.data.data;
  },

  getApplicationsForJob: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    const response = await api.patch(`/jobs/applications/${applicationId}/status`, { status });
    return response.data.data;
  },
};

export default jobsService;
