import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import siteConfig from "../cms/config.json";
import { domainRedirect, isPreviewOrigin } from "../cms/domain.mjs";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const redirect = domainRedirect(request, siteConfig);
    if (redirect) return redirect;
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, async () => {
      const response = await handler.fetch(request, env, ctx);
      if (!isPreviewOrigin(request, siteConfig)) return response;
      const headers = new Headers(response.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    });
  },
};
