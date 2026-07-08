"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateWebsiteAction } from "@/app/admin/actions";
import { initialActionState, type ActionState } from "@/types/actions";

type GenerateWebsiteButtonProps = {
  businessId: string;
  disabled?: boolean;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-9 items-center justify-center rounded-md bg-stone-950 px-3 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Generating..." : "Generate Website"}
    </button>
  );
}

export function GenerateWebsiteButton({
  businessId,
  disabled = false,
}: GenerateWebsiteButtonProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    generateWebsiteAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input name="business_id" type="hidden" value={businessId} />
      <SubmitButton disabled={disabled} />
      {state.status !== "idle" ? (
        <p
          className={
            state.status === "success"
              ? "max-w-56 text-xs leading-5 text-emerald-700"
              : "max-w-56 text-xs leading-5 text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
