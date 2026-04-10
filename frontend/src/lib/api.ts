import axios from "axios";
import { AnalyzeRequest, AnalyzeResponse, Dataset, IngestResponse, DatasetDetail, QueryResult, TeamMember, Alert, Integration, Scenario, SavedAnalysis, DBIngestRequest } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiSvc = {
  // Analysis
  analyze: async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const res = await api.post<AnalyzeResponse>("/analyze", data);
    return res.data;
  },

  quickAnalyze: async (question: string, datasetId?: string): Promise<AnalyzeResponse> => {
    const res = await api.post<AnalyzeResponse>("/analyze/quick", { question, dataset_id: datasetId });
    return res.data;
  },

  // Datasets
  getDatasets: async (): Promise<Dataset[]> => {
    const res = await api.get<Dataset[]>("/datasets");
    return res.data;
  },

  // Ingestion
  uploadFile: async (file: File): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await api.post<IngestResponse>("/ingest", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
  ingestDatabase: async (data: DBIngestRequest): Promise<IngestResponse> => {
    const res = await api.post<IngestResponse>("/ingest/db", data);
    return res.data;
  },

  // Dataset detail + management
  getDataset: async (dataset_id: string): Promise<DatasetDetail> => {
    const res = await api.get<DatasetDetail>(`/datasets/${dataset_id}`);
    return res.data;
  },

  deleteDataset: async (dataset_id: string): Promise<{ deleted: boolean }> => {
    const res = await api.delete<{ deleted: boolean }>(`/datasets/${dataset_id}`);
    return res.data;
  },

  queryDataset: async (dataset_id: string, sql: string): Promise<QueryResult> => {
    const res = await api.post<QueryResult>("/datasets/query", { dataset_id, sql });
    return res.data;
  },

  // Team
  getTeam: async (): Promise<TeamMember[]> => {
    const res = await api.get<TeamMember[]>("/team");
    return res.data;
  },
  inviteTeamMember: async (data: Partial<TeamMember>): Promise<TeamMember> => {
    const res = await api.post<TeamMember>("/team", data);
    return res.data;
  },
  updateTeamRole: async (id: string, role: string): Promise<TeamMember> => {
    const res = await api.put<TeamMember>(`/team/${id}`, { role });
    return res.data;
  },
  removeTeamMember: async (id: string): Promise<{ deleted: true }> => {
    const res = await api.delete<{ deleted: true }>(`/team/${id}`);
    return res.data;
  },

  // Alerts
  getAlerts: async (): Promise<Alert[]> => {
    const res = await api.get<Alert[]>("/alerts");
    return res.data;
  },
  createAlert: async (data: Partial<Alert>): Promise<Alert> => {
    const res = await api.post<Alert>("/alerts", data);
    return res.data;
  },
  updateAlertStatus: async (id: string, status: string): Promise<Alert> => {
    const res = await api.put<Alert>(`/alerts/${id}/status`, { status });
    return res.data;
  },
  deleteAlert: async (id: string): Promise<{ deleted: true }> => {
    const res = await api.delete<{ deleted: true }>(`/alerts/${id}`);
    return res.data;
  },

  // Integrations
  getIntegrations: async (): Promise<Integration[]> => {
    const res = await api.get<Integration[]>("/integrations");
    return res.data;
  },
  updateIntegration: async (id: string, status: string): Promise<Integration> => {
    const res = await api.put<Integration>(`/integrations/${id}`, { status });
    return res.data;
  },

  // Simulator
  getScenarios: async (): Promise<Scenario[]> => {
    const res = await api.get<Scenario[]>("/simulator/scenarios");
    return res.data;
  },
  saveScenario: async (data: Partial<Scenario>): Promise<Scenario> => {
    const res = await api.post<Scenario>("/simulator/scenarios", data);
    return res.data;
  },
  deleteScenario: async (id: string): Promise<{ deleted: true }> => {
    const res = await api.delete<{ deleted: true }>(`/simulator/scenarios/${id}`);
    return res.data;
  },

  // Analyses History
  getAnalyses: async (mode?: string): Promise<SavedAnalysis[]> => {
    const url = mode ? `/analyses?mode=${mode}` : "/analyses";
    const res = await api.get<SavedAnalysis[]>(url);
    return res.data;
  },
  saveAnalysis: async (data: Partial<SavedAnalysis>): Promise<SavedAnalysis> => {
    const res = await api.post<SavedAnalysis>("/analyses", data);
    return res.data;
  },
  deleteAnalysis: async (id: string): Promise<{ deleted: true }> => {
    const res = await api.delete<{ deleted: true }>(`/analyses/${id}`);
    return res.data;
  },
};

export default api;
