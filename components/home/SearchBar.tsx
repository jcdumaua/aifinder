import type {
  ChangeEventHandler,
  FormEventHandler,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <div className="min-w-0 flex-1">
        <Label htmlFor="ai-tool-search" className="sr-only">
          Search AI tools
        </Label>
        <Input
          id="ai-tool-search"
          type="search"
          name="ai-tool-search"
          value={search}
          onChange={onChange}
          placeholder="Find AI tools for video editing..."
          autoComplete="off"
          aria-label="Search AI tools"
          className={`h-auto rounded-2xl border px-5 py-4 font-medium ${inputBg} ai-command-search`}
          suppressHydrationWarning
        />
      </div>

      <Button
        type="submit"
        className="ai-product-button-primary rounded-2xl px-5 py-3 text-sm sm:px-6"
      >
        Search
      </Button>
    </form>
  );
}
