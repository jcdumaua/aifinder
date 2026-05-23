import type {
  ChangeEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
} from "react";

type SearchBarProps = {
  search: string;
  inputBg: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
};

export function SearchBar({
  search,
  inputBg,
  onChange,
  onBlur,
  onKeyDown,
}: SearchBarProps) {
  return (
    <input
      value={search}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Ask AiFinder to discover the perfect AI tool..."
      className={`mt-8 w-full rounded-2xl border px-5 py-4 shadow-xl outline-none focus:border-cyan-400 ${inputBg} ai-command-search`}
    />
  );
}
