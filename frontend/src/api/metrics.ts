import { api } from "./client";

export interface Metric {
  id: number;
  execution_config_id: number;
  metric_type: string;
  details_json: MetricDetails;
}

export interface MetricDetails {
  accuracy?: number | undefined;
  precision?: number;
  recall?: number;
  f1?: number;

  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;

  totalItems?: number;
  correctItems?: number;

  confusion?: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
}

export const getMetrics = async (
  experimentId: number
): Promise<Metric[]> => {
  const { data } = await api.get(`/metrics/${experimentId}`);
  return data;
};