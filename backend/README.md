# promptEval
TCC

## Formato para csv e json
### Formato Json:
```
[
  {
    "query": "Qual a capital do Brasil?",
    "context": "",
    "expected_answer": "Brasília"
  },
  {
    "query": "Qual o preço do plano Premium?",
    "context": "O plano Premium custa R$49,90 por mês.",
    "expected_answer": "R$49,90 por mês"
  }
]
```

### Formato CSV:

query,context,expected_answer

"Qual a capital do Brasil?","","Brasília"

"Qual o preço do plano Premium?","O plano Premium custa R$49,90 por mês.","R$49,90 por mês"

[Dataset-exemple](https://docs.google.com/spreadsheets/d/1Mu_uU0doIVvvfUKHP08oi3KxyRqePLoHqkbXv5XTRVc/edit?usp=sharing) 


## Rodando Localmente
Subindo o Docker 
  ```bash
   docker compose up -d
```

Rodando a aplicação 
  ```bash
    uvicorn app.main:app --reload
```

Acesse para testar
  ```bash
    http://127.0.0.1:8000/docs
```

Para formatar o código
  ```bash
    ruff format .
```

Corrigir erros de lint 
  ```bash
    ruff check --fix .
```
