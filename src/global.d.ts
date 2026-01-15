import { Auth0Client } from "@auth0/auth0-spa-js";

declare global {
  interface Window {
    auth0Client: Auth0Client;
  }
}
