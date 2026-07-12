SUPPORTED_PROVIDERS = {
    "openai": {
        "display_name": "OpenAI",
        "credential_fields": [
            "OPENAI_API_KEY",
        ],
        "models": [
            "gpt-5",
            "gpt-5-mini",
            "gpt-5-nano",
            "gpt-4.1",
            "gpt-4.1-mini",
        ],
    },
    "gemini": {
        "display_name": "Google Gemini",
        "credential_fields": [
            "GEMINI_API_KEY",
        ],
        "models": [
            "gemini-2.5-pro",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
        ],
    },
    "anthropic": {
        "display_name": "Anthropic",
        "credential_fields": [
            "ANTHROPIC_API_KEY",
        ],
        "models": [
            "claude-opus-4",
            "claude-sonnet-4",
            "claude-3-7-sonnet",
        ],
    },
    "bedrock": {
        "display_name": "AWS Bedrock",
        "credential_fields": [
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_REGION",
        ],
        "models": [
            # Claude
            "anthropic.claude-opus-4",
            "anthropic.claude-sonnet-4",
            "anthropic.claude-3-7-sonnet",
            # Amazon Nova
            "amazon.nova-pro-v1:0",
            "amazon.nova-lite-v1:0",
            "amazon.nova-micro-v1:0",
            # DeepSeek
            "deepseek.r1-v1:0",
            # Llama
            "meta.llama3-3-70b-instruct-v1:0",
            "meta.llama3-2-90b-instruct-v1:0",
            "meta.llama3-2-11b-instruct-v1:0",
        ],
    },
}


def get_provider(name: str):
    return SUPPORTED_PROVIDERS.get(name)


def get_models(provider: str):
    return SUPPORTED_PROVIDERS[provider]["models"]


def get_credential_fields(provider: str):
    return SUPPORTED_PROVIDERS[provider]["credential_fields"]
