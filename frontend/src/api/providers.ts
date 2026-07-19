import { api } from "./client";

export type Provider = {
  id: string;
  display_name: string;
};

export type ProviderConfig = {
  display_name: string;
  credential_fields: string[];
  models: string[];
};

export const getProviders = async () => {
  const { data } = await api.get<Provider[]>("/providers");
  return data;
};

export const getProvider = async (provider: string) => {
  const { data } = await api.get<ProviderConfig>(
    `/providers/${provider}`
  );

  return data;
};

export const getProviderModels = async (
  provider: string
) => {
  const { data } = await api.get<string[]>(
    `/providers/${provider}/models`
  );

  return data;
};

export const getProviderCredentialFields = async (
  provider: string
) => {
  const { data } = await api.get<string[]>(
    `/providers/${provider}/credential-fields`
  );

  return data;
};