/** Deployment origins are explicit settings; never derive canonical URLs from headers. */
export function deploymentOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A full HTTPS site origin is required.');
  const raw = value.trim();
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.pathname !== '/' || url.search || url.hash || /[\\\s*?#]/u.test(raw) ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(url.hostname) ||
      /(?:^|\.)localhost$/i.test(url.hostname) || /^\d+(?:\.\d+){3}$/.test(url.hostname)) {
    throw new Error('Use an exact HTTPS domain without credentials, a port, path, query or wildcard.');
  }
  // URL normalizes the default :443 port; reject explicit ports as well.
  if (/^https:\/\/[^/]*:/i.test(raw)) throw new Error('The site origin must not include a port.');
  return url.origin;
}

export function isDevelopmentOrigin(value) {
  return /(?:^|\.)(?:workers\.dev|pages\.dev|chatgpt\.site)$/.test(new URL(value).hostname);
}

export function resolveDeploymentConfig(config, override) {
  const primary = deploymentOrigin(override === undefined ? config.siteOrigin || config.canonicalOrigin : override);
  // SITE_URL may be a preview host. Only a production-domain override may change canonical identity.
  const canonical = override !== undefined && !isDevelopmentOrigin(primary) ? primary : deploymentOrigin(config.canonicalOrigin || primary);
  const legacyOrigins = [...new Set([
    ...(config.legacyOrigins || []), config.siteOrigin, config.canonicalOrigin,
  ].filter(Boolean).map(deploymentOrigin))];
  return { ...config, siteOrigin: primary, canonicalOrigin: canonical, legacyOrigins };
}

export function domainRedirect(request, config) {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  const primary = deploymentOrigin(config.canonicalOrigin || config.siteOrigin);
  const aliases = (config.redirectOrigins || []).map(deploymentOrigin);
  const secureOrigin = 'https://' + url.host;
  const shouldRedirect = (url.protocol === 'http:' && [primary, ...aliases].includes(secureOrigin)) ||
    (url.origin !== primary && aliases.includes(url.origin));
  if (!shouldRedirect) return null;
  return new Response(null, { status: 308, headers: {
    Location: primary + url.pathname + url.search,
    'Cache-Control': 'public, max-age=300',
  } });
}

export function isPreviewOrigin(request, config) {
  return isDevelopmentOrigin(request.url) || new URL(request.url).origin !== deploymentOrigin(config.canonicalOrigin || config.siteOrigin);
}
