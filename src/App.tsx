import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ChatPage } from './pages/ChatPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MessagesPage } from './pages/MessagesPage'
import { ProfilePage } from './pages/ProfilePage'
import { PublishPage } from './pages/PublishPage'
import { RegisterPage } from './pages/RegisterPage'
import { RequestsPage } from './pages/RequestsPage'
import { SearchPage } from './pages/SearchPage'
import { VerifyPage } from './pages/VerifyPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/mensajes" element={<MessagesPage />} />
          <Route path="/mensajes/:id" element={<ChatPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/perfil/:id" element={<ProfilePage />} />
          <Route path="/solicitudes" element={<RequestsPage />} />
          <Route path="/publicar" element={<PublishPage />} />
          <Route path="/verificar" element={<VerifyPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
