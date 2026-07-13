import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

// 1. Importe a sua página de Login
import LoginPage from './pages/login' // ajuste o caminho se o nome do arquivo for diferente
import RecoverPage from './pages/recover'
import SignupPage from './pages/signup'
import ApiKeysPage from './pages/credentials'
import AppLayout from './pages/app'
import RunPage from './pages/experiments'
import DatasetsPage from './pages/datasets'
import EvaluationsPage from './pages/evaluations'
import Route from './pages/app_index'

// 2. Configure as rotas
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/recover",
    element: <RecoverPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/app",
    element: <AppLayout />, 
    children: [
      {
        path: "credentials",
        element: <ApiKeysPage />,
      },
      {
        path: "run",
        element: <RunPage />,
      },
      {
        path: "datasets",
        element: <DatasetsPage />,
      },
      {
        path: "evaluations",
        element: <EvaluationsPage />,
      },
      {
        path: "",
        element: <Route />,
      }
     
    ]
  }
])

// 3. Renderize o provedor de rotas
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)