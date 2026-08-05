export const ADMIN_V1_ALLOWED_PAGE_PATHS: readonly string[] = Object.freeze([
  "/admin",
  "/admin/tools",
  "/admin/moderation",
]);

export const ADMIN_V1_ALLOWED_API_METHODS: Readonly<
  Record<string, readonly string[]>
> = Object.freeze({
  "/api/admin/login": Object.freeze(["POST"]),
  "/api/admin/logout": Object.freeze(["POST"]),
  "/api/admin/session": Object.freeze(["GET"]),
  "/api/admin/csrf": Object.freeze(["GET"]),
  "/api/admin/tools": Object.freeze(["GET", "POST", "PUT", "DELETE"]),
  "/api/admin/submissions": Object.freeze(["GET", "POST", "PUT", "PATCH"]),
  "/api/admin/upload-logo": Object.freeze(["POST"]),
});

const EMPTY_METHODS: readonly string[] = Object.freeze([]);

export type AdminV1PathClassification =
  | "NOT_ADMIN_SURFACE"
  | "ALLOW_ADMIN_LOGIN_PAGE"
  | "ALLOW_ADMIN_PAGE"
  | "DENY_ADMIN_PAGE"
  | "ALLOW_ADMIN_API"
  | "DENY_ADMIN_API_PATH"
  | "DENY_ADMIN_API_METHOD";

export function classifyAdminV1Path(
  pathname: string,
  method?: string,
): AdminV1PathClassification {
  if (pathname === "/admin-login") {
    return "ALLOW_ADMIN_LOGIN_PAGE";
  }

  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    const allowedMethods = allowedAdminV1Methods(pathname);

    if (allowedMethods.length === 0) {
      return "DENY_ADMIN_API_PATH";
    }

    const normalizedMethod = (method || "").toUpperCase();
    return allowedMethods.includes(normalizedMethod)
      ? "ALLOW_ADMIN_API"
      : "DENY_ADMIN_API_METHOD";
  }

  if (pathname.startsWith("/admin")) {
    return isAdminV1PageAllowed(pathname)
      ? "ALLOW_ADMIN_PAGE"
      : "DENY_ADMIN_PAGE";
  }

  return "NOT_ADMIN_SURFACE";
}

export function isAdminV1PageAllowed(pathname: string): boolean {
  return ADMIN_V1_ALLOWED_PAGE_PATHS.includes(pathname);
}

export function isAdminV1ApiMethodAllowed(
  pathname: string,
  method: string,
): boolean {
  return allowedAdminV1Methods(pathname).includes(method.toUpperCase());
}

export function allowedAdminV1Methods(pathname: string): readonly string[] {
  return ADMIN_V1_ALLOWED_API_METHODS[pathname] ?? EMPTY_METHODS;
}
