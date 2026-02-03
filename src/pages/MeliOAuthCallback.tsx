import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function buildIntegrationsRedirect(params: Record<string, string | undefined>) {
  const url = new URL(`${window.location.origin}/integrations`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.pathname + url.search;
}

export default function MeliOAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state") || "";
      const oauthError = params.get("error");
      const oauthErrorDescription = params.get("error_description") || "";

      if (oauthError) {
        console.error("[ML OAuth] authorize_error", { oauthError, oauthErrorDescription });
        if (!cancelled) {
          navigate(
            buildIntegrationsRedirect({
              ml_error: oauthError,
              ml_error_description: oauthErrorDescription,
            }),
            { replace: true }
          );
        }
        return;
      }

      if (!code) {
        console.error("[ML OAuth] missing_code", window.location.search);
        if (!cancelled) {
          navigate(
            buildIntegrationsRedirect({
              ml_error: "missing_code",
              ml_error_description: "Código de autorização não encontrado no callback.",
            }),
            { replace: true }
          );
        }
        return;
      }

      const expectedState = sessionStorage.getItem("ml_oauth_state") || "";
      if (!expectedState || expectedState !== state) {
        console.error("[ML OAuth] invalid_state", { expectedState, receivedState: state });
        if (!cancelled) {
          navigate(
            buildIntegrationsRedirect({
              ml_error: "invalid_state",
              ml_error_description: "State inválido. Tente conectar novamente.",
            }),
            { replace: true }
          );
        }
        return;
      }

      const clientId = sessionStorage.getItem("ml_client_id") || "";
      const clientSecret = sessionStorage.getItem("ml_client_secret") || "";
      const redirectUri =
        sessionStorage.getItem("ml_redirect_uri") ||
        `${window.location.origin}/api/integrations/meli/callback`;

      if (!clientId || !clientSecret) {
        console.error("[ML OAuth] missing_client_credentials");
        if (!cancelled) {
          navigate(
            buildIntegrationsRedirect({
              ml_error: "missing_client_credentials",
              ml_error_description: "Client ID/Secret não encontrados. Abra Integrações e conecte novamente.",
            }),
            { replace: true }
          );
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      if (!jwt) {
        // User is no longer authenticated in the app.
        if (!cancelled) navigate("/auth", { replace: true });
        return;
      }

      const fnBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const fnUrl = `${fnBaseUrl}/functions/v1/meli-oauth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

      console.log("[ML OAuth] redirect_uri(authorize)", redirectUri);
      console.log("[ML OAuth] redirect_uri(token_exchange)", redirectUri);
      console.log("[ML OAuth] calling_function", fnUrl);

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const responseText = await res.text();
      console.log("[ML OAuth] token_exchange_status", res.status);
      console.log("[ML OAuth] token_exchange_body", responseText);

      if (!res.ok) {
        if (!cancelled) {
          navigate(
            buildIntegrationsRedirect({
              ml_error: "token_exchange_failed",
              ml_error_description: responseText.slice(0, 500),
            }),
            { replace: true }
          );
        }
        return;
      }

      // Clear sensitive values on success
      sessionStorage.removeItem("ml_client_id");
      sessionStorage.removeItem("ml_client_secret");
      sessionStorage.removeItem("ml_oauth_state");
      sessionStorage.removeItem("ml_redirect_uri");

      if (!cancelled) {
        navigate(buildIntegrationsRedirect({ ml_success: "1" }), { replace: true });
      }
    }

    run().catch((err) => {
      console.error("[ML OAuth] unexpected_error", err);
      navigate(
        buildIntegrationsRedirect({
          ml_error: "unexpected_error",
          ml_error_description: err instanceof Error ? err.message : "Erro desconhecido",
        }),
        { replace: true }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-[60vh] bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-none">Conectando Mercado Livre…</h1>
              <p className="mt-1 text-sm text-muted-foreground break-words">
                Estamos finalizando a autorização e salvando sua integração.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
