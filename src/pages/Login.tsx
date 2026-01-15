import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={() => loginWithRedirect()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Login
      </button>
    </div>
  );
}
