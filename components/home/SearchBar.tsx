import type {
  ChangeEventHandler,
  FormEventHandler,
} from "react";

type SearchBarProps = {
  search: string;
  inputBg: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function SearchBar({
  search,
  inputBg,
  onChange,
  onSubmit,
}: SearchBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex flex-col gap-2.5 sm:flex-row"
      suppressHydrationWarning
    >
      <input
        type="search"
        name="ai-tool-search"
        value={search}
        onChange={onChange}
        placeholder="Find AI tools for video editing..."
        autoComplete="off"
        className={`w-full rounded-2xl border px-5 py-4 font-medium outline-none ${inputBg} ai-command-search`}
        suppressHydrationWarning
      />

      <button
        type="submit"
        className="ai-product-button-primary rounded-2xl px-5 py-3 text-sm sm:px-6"
      >
        Search
      </button>
    </form>
  );
}
