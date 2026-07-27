import type { ResultRow } from "../pages/evaluations";
import { api } from "./client";

export interface DashboardMetrics {
  accuracy: number;
  f1: number;
  precision: number;
  recall: number;
  labels: string[];

  confusion_matrix: number[][];

  report: Record<
    string,
    {
      precision: number;
      recall: number;
      "f1-score": number;
      support: number;
    }
  >;
}

export interface DashboardModel {
  executionConfigId: number;

  modelName: string;
  temperature: number;

  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  metrics: DashboardMetrics;

  results: ResultRow[];
}

export interface DashboardResponse {
  experimentName: string;
  datasetName: string;
  evalType: string;
  prompt: string;
  createdAt: string;

  models: DashboardModel[];
}

export const getDashboard = async (
  experimentId: number
): Promise<DashboardResponse> => {
  const { data } = await api.get(`/metrics/${experimentId}`);
  console.log("Dashboard data:", data);
  return data;
};
