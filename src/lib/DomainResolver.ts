export type AppType = "marketplace" | "saas-admin" | "tenant-workspace" | "customer-portal" | "agent-portal";

export interface ResolvedDomain {
  appType: AppType;
  tenant: string | null;
  isStaging: boolean;
  originalHostname: string;
}

export class DomainResolver {
  static resolve(hostname: string): ResolvedDomain {
    const host = hostname.toLowerCase().trim();

    // Staging and production domain patterns
    const isStaging = host.includes("staging.bhoomione.in");
    const domainBase = isStaging ? "staging.bhoomione.in" : "bhoomione.in";

    // If host matches the bare domain or contains the pattern
    if (host === "bhoomione.in" || host === "staging.bhoomione.in") {
      return {
        appType: "marketplace",
        tenant: null,
        isStaging,
        originalHostname: host,
      };
    }

    if (host.endsWith("." + domainBase)) {
      // Remove trailing domainBase
      const subdomainsPart = host.substring(0, host.length - domainBase.length - 1);
      const parts = subdomainsPart.split(".");

      // Examples: 
      // admin.bhoomione.in -> parts = ['admin']
      // {tenant}.bhoomione.in -> parts = ['{tenant}']
      // portal.{tenant}.bhoomione.in -> parts = ['portal', '{tenant}']
      // agents.{tenant}.bhoomione.in -> parts = ['agents', '{tenant}']

      if (parts.length === 1) {
        if (parts[0] === "admin") {
          return {
            appType: "saas-admin",
            tenant: null,
            isStaging,
            originalHostname: host,
          };
        } else {
          return {
            appType: "tenant-workspace",
            tenant: parts[0],
            isStaging,
            originalHostname: host,
          };
        }
      } else if (parts.length === 2) {
        if (parts[0] === "portal") {
          return {
            appType: "customer-portal",
            tenant: parts[1],
            isStaging,
            originalHostname: host,
          };
        } else if (parts[0] === "agents") {
          return {
            appType: "agent-portal",
            tenant: parts[1],
            isStaging,
            originalHostname: host,
          };
        }
      }
    }

    // Default Fallback mode if unrecognized (e.g. localhost or AI Studio)
    return {
      appType: "marketplace", // start on Marketplace as default
      tenant: "bhoomi-alpha",
      isStaging: true,
      originalHostname: host,
    };
  }
}
