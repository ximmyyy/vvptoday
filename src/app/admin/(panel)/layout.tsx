import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-4xl">Geen toegang</h1>
        <p className="text-muted">
          {user?.email} is geen admin. Voeg dit account toe aan de tabel <code>admins</code> in Supabase.
        </p>
        <form action={signOut}><button className="btn-ghost">Uitloggen</button></form>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <Link href="/admin" className="font-display text-2xl">Admin paneel</Link>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{user?.email}</span>
          <form action={signOut}><button className="btn-ghost !py-2">Uitloggen</button></form>
        </div>
      </div>
      {children}
    </div>
  );
}
