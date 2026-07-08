"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/admin/actions";
import { initialActionState, type ActionState } from "@/types/actions";

type AdminLoginFormProps = {
  isConfigured: boolean;
};

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Checking..." : "Enter dashboard"}
    </button>
  );
}

export function AdminLoginForm({ isConfigured }: AdminLoginFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    loginAction,
    initialActionState,
  );

  return (
    <section className="w-full rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
        Protected admin
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-stone-950">
        Sign in to continue
      </h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Use the password configured in ADMIN_PASSWORD.
      </p>

      {!isConfigured ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ADMIN_PASSWORD is not configured yet.
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <input
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-blue-600"
            name="password"
            placeholder="Enter admin password"
            type="password"
          />
        </label>

        {state.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.message}
          </p>
        ) : null}

        <LoginButton />
      </form>
    </section>
  );
}
