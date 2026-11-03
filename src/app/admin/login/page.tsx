"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <section className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display mb-6 text-4xl">Admin login</h1>
      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="username" />
        </div>
        <div>
          <label className="label" htmlFor="password">Wachtwoord</label>
          <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button className="btn-accent w-full" disabled={pending}>{pending ? "Inloggen…" : "Inloggen"}</button>
      </form>
    </section>
  );
}
