import { api } from "./client";

export type CredentialPayload = {
  name: string;
  provider: string;
  key: Record<string, string>;
};

export type Credential = {
  id: number;
  name: string;
  provider: string;
  key: Record<string, string>;
};

export const createCredential = async (
  payload: CredentialPayload
) => {
  const { data } = await api.post("/credentials", payload);
  return data;
};


export const getCredentials = async () => {
  const { data } = await api.get<Credential[]>("/credentials");
  return data;
};


export const getCredentialById = async (
  id: number
) => {
  const { data } = await api.get(`/credentials/${id}`);
  return data;
};


export const deleteCredential = async (
  id: number
) => {
  const { data } = await api.delete(`/credentials/${id}`);
  return data;
};


export const updateCredential = async (
  id: number,
  payload: CredentialPayload
) => {
  const { data } = await api.put(
    `/credentials/${id}`,
    payload
  );

  return data;
};