from litellm import completion


async def get_model_response(prompt: str, provider: str, model_id: str):
    try:
        response = completion(
            model=f"{provider}/{model_id}",
            messages=[{"content": prompt, "role": "user"}],
        )
        return response
    except Exception as e:
        raise Exception(f"Erro ao chamar o modelo {model_id}: {str(e)}")
