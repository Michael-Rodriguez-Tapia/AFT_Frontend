import { useAuth0 } from "@auth0/auth0-react";

export default function Home() {
  const { loginWithRedirect } = useAuth0();
  return (
    <button
      onClick={() =>
        loginWithRedirect({
          authorizationParams: {
            redirect_uri: window.location.origin + "/dashboard",
          },
        })
      }
    >
      Login
    </button>
  );
}
