import Link from "next/link";

const PUBLIC_ROUTE_ERROR_COPY = {
  root: {
    title: "Something went wrong",
    description: "AiFinder could not load this page. You can try again or return home.",
  },
  compare: {
    title: "Comparison unavailable",
    description: "AiFinder could not load the comparison page. Try again or return home.",
  },
  category: {
    title: "Category unavailable",
    description: "AiFinder could not load this category. Try again or return home.",
  },
  tool: {
    title: "Tool page unavailable",
    description: "AiFinder could not load this tool page. Try again or return home.",
  },
  submit: {
    title: "Submission page unavailable",
    description: "AiFinder could not load the submission page. Try again or return home.",
  },
  notFound: {
    title: "Page not found",
    description: "The page you requested is not available.",
  },
} as const;

export type PublicRouteErrorVariant = keyof typeof PUBLIC_ROUTE_ERROR_COPY;

type PublicRouteErrorProps = {
  variant: PublicRouteErrorVariant;
  reset?: () => void;
};

export function PublicRouteError({
  variant,
  reset,
}: PublicRouteErrorProps) {
  const copy = PUBLIC_ROUTE_ERROR_COPY[variant];

  return (
    <main className="ai-product-page flex min-h-dvh items-center justify-center px-4 py-12">
      <section
        className="ai-product-surface w-full max-w-xl rounded-[2rem] border p-8 text-center shadow-2xl sm:p-10"
        aria-labelledby="public-route-error-title"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          AiFinder
        </p>
        <h1
          id="public-route-error-title"
          className="ai-product-section-title mt-4 text-3xl sm:text-4xl"
        >
          {copy.title}
        </h1>
        <p className="ai-product-body mx-auto mt-4 max-w-md leading-7">
          {copy.description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {reset ? (
            <button
              type="button"
              className="ai-product-button-primary rounded-xl px-5 py-3 text-sm font-semibold"
              onClick={reset}
            >
              Try again
            </button>
          ) : null}
          <Link
            href="/"
            className="ai-product-button-secondary rounded-xl px-5 py-3 text-sm font-semibold"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
