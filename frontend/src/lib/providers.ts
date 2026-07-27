export type ProviderId = "openai" | "gemini" | "anthropic" | "bedrock";

export type ProviderConfig = {
  id: ProviderId;
  display_name: string;
  credential_fields: string[];
  models: string[];
};

export const SUPPORTED_PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: "openai",
    display_name: "OpenAI",
    credential_fields: ["OPENAI_API_KEY"],
    models: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4.1", "gpt-4.1-mini"],
  },
  gemini: {
    id: "gemini",
    display_name: "Google Gemini",
    credential_fields: ["GEMINI_API_KEY"],
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
  },
  anthropic: {
    id: "anthropic",
    display_name: "Anthropic",
    credential_fields: ["ANTHROPIC_API_KEY"],
    models: ["claude-opus-4", "claude-sonnet-4", "claude-3-7-sonnet"],
  },
  bedrock: {
    id: "bedrock",
    display_name: "AWS Bedrock",
    credential_fields: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
    models: [
      "anthropic.claude-opus-4",
      "anthropic.claude-sonnet-4",
      "anthropic.claude-3-7-sonnet",
      "amazon.nova-pro-v1:0",
      "amazon.nova-lite-v1:0",
      "amazon.nova-micro-v1:0",
      "deepseek.r1-v1:0",
      "meta.llama3-3-70b-instruct-v1:0",
      "meta.llama3-2-90b-instruct-v1:0",
      "meta.llama3-2-11b-instruct-v1:0",
    ],
  },
};

export const PROVIDER_LIST: ProviderConfig[] = Object.values(SUPPORTED_PROVIDERS);