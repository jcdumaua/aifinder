export type PublicDiagnosticEvent =
  | "PUBLIC_HOMEPAGE_TOOLS_LOAD_FAILED"
  | "PUBLIC_COMPARE_TOOLS_LOAD_FAILED"
  | "PUBLIC_CATEGORY_TOOLS_LOAD_FAILED"
  | "PUBLIC_TOOL_DETAIL_LOAD_FAILED"
  | "PUBLIC_SITEMAP_TOOLS_LOAD_FAILED";

export function logPublicDiagnosticEvent(event: PublicDiagnosticEvent) {
  console.error(event);
}
