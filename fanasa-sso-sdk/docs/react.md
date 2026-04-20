# @fanasa/sso — Guía de integración React

## Instalación

```bash
npm install @fanasa/sso
```

## 1. Hook principal `useFanasaSSO`

```tsx
// App.tsx
import { useFanasaSSO } from '@fanasa/sso/react';

export function App() {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    loginPopup,
    logout,
  } = useFanasaSSO({
    ssoUrl:     'https://aplicacion.fanasa.com/SSO',
    clientName: 'Mi App React',
  });

  if (loading) return <p>Conectando...</p>;

  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={() => loginPopup()}>
          Iniciar sesión con Microsoft
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h2>Hola, {user?.name}</h2>
      <p>{user?.email}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

## 2. Contexto global (recomendado para apps grandes)

```tsx
// SSOContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useFanasaSSO, UseFanasaSSOReturn } from '@fanasa/sso/react';

const SSO_CONFIG = {
  ssoUrl:     'https://aplicacion.fanasa.com/SSO',
  clientName: 'Mi App React',
};

const SSOContext = createContext<UseFanasaSSOReturn | null>(null);

export function SSOProvider({ children }: { children: ReactNode }) {
  const sso = useFanasaSSO(SSO_CONFIG);
  return <SSOContext.Provider value={sso}>{children}</SSOContext.Provider>;
}

// Hook para usar en cualquier componente hijo
export function useSSO() {
  const ctx = useContext(SSOContext);
  if (!ctx) throw new Error('useSSO debe usarse dentro de <SSOProvider>');
  return ctx;
}

// main.tsx
<SSOProvider>
  <App />
</SSOProvider>
```

## 3. Ruta protegida con React Router

```tsx
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useSSO } from './SSOContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSSO();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

// App.tsx — Rutas
<Routes>
  <Route path="/login"     element={<Login />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
</Routes>
```

## 4. Enviar token a tu API

```typescript
// api.ts
import { useSSO } from './SSOContext';

function useApi() {
  const { getToken } = useSSO();

  async function fetchProductos() {
    const token = getToken();
    const res = await fetch('/api/productos', {
      headers: {
        'Authorization': `Bearer ${token?.idToken}`,
      },
    });
    return res.json();
  }

  return { fetchProductos };
}
```
