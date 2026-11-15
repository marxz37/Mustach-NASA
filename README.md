# Mustach NASA

Aplicação local demonstrativa de monitoramento de exposição radiológica. Os dados exibidos são sintéticos e o projeto não é um dispositivo médico nem um mecanismo de autorização de EVA.

## Pré-requisitos

- Python 3.10 ou superior
- Node.js 22 ou superior
- npm

## Iniciar no Windows

Na raiz do projeto, abra três terminais e execute um arquivo em cada terminal:

```text
iniciar-backend.bat
iniciar-frontend.bat
iniciar-wearable.bat
```

Depois acesse:

- Web: <http://localhost:5173>
- Wearable: <http://localhost:5174>
- API: <http://localhost:8000/docs>

## Iniciar manualmente

### Backend

```bash
cd backend
python -m venv .venv
```

No Windows:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

No Linux ou macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Web

```bash
cd frontend
npm install
npm run dev
```

### Wearable

```bash
cd wearable
npm install
npm run dev
```

Os frontends encaminham as chamadas `/api` para o backend local na porta 8000. Para usar uma API em outro endereço, crie um arquivo `.env` em `frontend/` e `wearable/` com:

```text
VITE_API_BASE_URL=http://endereco-da-api:8000
```

## Banco local

O backend cria automaticamente o banco SQLite na primeira execução. Para alterar o caminho, defina `SENTINELA_DATABASE_PATH`.

O Wearable é uma prévia web; não há conexão com relógio físico, Bluetooth ou sensores.
