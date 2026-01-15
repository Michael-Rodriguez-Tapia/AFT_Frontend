import { useEffect } from "react";
import api from "../services/api";
import { useAuth0 } from "@auth0/auth0-react";

export default function AuthSync({ setRole }: { setRole: (r: string) => void }) {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const sync = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const token = await getAccessTokenSilently();

        const res = await api.post(
          "/auth/sync",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRole(res.data.user.role);
      } catch (err) {
        console.error("Error sincronizando usuario:", err);
      }
    };

    sync();
  }, [isAuthenticated, user]);

  return null;
}
