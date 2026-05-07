# promptCheck
TCC

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