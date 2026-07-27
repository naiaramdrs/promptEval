// api/datasets.ts

import { api } from "./client";

export interface DatasetResponse {
  id: number;
  name: string;
}

export const uploadDataset = async (file: File | null) => {
  console.log(file);

  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  console.log("FormData entries:", [...formData.entries()]);

  const { data } = await api.post("/upload-dataset", formData);

  return data;
};

export const getDatasets = async () => {
  const { data } = await api.get("/datasets");
  return data;
};

export const getDatasetById = async (id: number) => {
  const { data } = await api.get(`/datasets/${id}`);
  return data;
};

export const deleteDataset = async (id: number) => {
  await api.delete(`/datasets/${id}`);
};

export const downloadDataset = async (
  datasetId: number,
  format: "csv" | "json",
  filename: string,
) => {
  const { data } = await api.get(`/datasets/${datasetId}/download`, {
    params: {
      file_format: format,
    },
    responseType: "blob",
  });

  const blob = new Blob([data]);

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  a.remove();

  window.URL.revokeObjectURL(url);
};
