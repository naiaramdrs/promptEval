export type RunExperimentPayload = {
  dataset_id: number;
  name: string;
  evaluation_type: string;
  prompt_content: string;
  credential_id: number;
  model_name: string;
  temperature: number;
};

export type Experiment = {
  id: number;
  name: string;
  dataset_id: number;
  evaluation_type: string;
  status: EvaluationStatus;
  created_at: string;
};

export type RunExperimentResponse = {
  message: string;
  experiment_id: number;
  execution_config_id: number;
  total_processed: number;
};

import type { EvaluationStatus } from "../pages/evaluations";
import { api } from "./client";

export const runExperiment = async (
  payload: RunExperimentPayload
): Promise<RunExperimentResponse> => {
  const { data } = await api.post("/run", payload);
  return data;
};

export const getExperiments = async (): Promise<Experiment[]> => {
  const { data } = await api.get("/experiments");
  return data;
};

export const getExperiment = async (
  id: number,
): Promise<Experiment> => {
  const { data } = await api.get(`/experiments/${id}`);
  return data;
};

export const deleteExperiment = async (
  id: number,
): Promise<void> => {
  await api.delete(`/experiments/${id}`);
};