import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN!;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID!;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE!;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,     // 🔥 Correcto
        audience,
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}                     // 🔥 Obligatorio
      useRefreshTokensFallback={true}            // 🔥 Obligatorio
    >
      {children}
    </Auth0Provider>
  );
};
