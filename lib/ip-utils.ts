// Utility to get real client IP behind Cloudflare
export function getClientIP(request: Request): string {
  // Cloudflare's connecting IP header (most reliable)
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // X-Forwarded-For header (fallback)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Remote address (last resort)
  const remoteAddr = request.headers.get("remote-addr");
  if (remoteAddr) {
    return remoteAddr.trim();
  }

  // If all else fails
  return "unknown";
}

// Check if IP is from Cloudflare (for additional security)
export function isCloudflareRequest(request: Request): boolean {
  return !!(
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("cf-ray") ||
    request.headers.get("cf-visitor")
  );
}

// Validate IP address format
export function isValidIP(ip: string): boolean {
  if (ip === "unknown") return false;

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
