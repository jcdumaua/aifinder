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
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
      <input
        value={search}
        onChange={onChange}
        placeholder="Find AI tools for video editing..."
        className={`w-full rounded-2xl border px-5 py-4 font-medium shadow-xl outline-none transition-[border-color,box-shadow] focus:border-cyan-400 ${inputBg} ai-command-search`}
      />

      <button
        type="submit"
        className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.24)] transition hover:bg-cyan-300 [.theme-light_&]:bg-slate-950 [.theme-light_&]:text-white [.theme-light_&]:shadow-[0_10px_24px_rgba(15,23,42,0.16)] [.theme-light_&]:hover:bg-slate-800 sm:px-6"
      >
        Search
      </button>
    </form>
  );
}
