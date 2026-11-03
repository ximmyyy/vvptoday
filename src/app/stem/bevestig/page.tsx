import { ConfirmForm } from "./ConfirmForm";

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-caps text-orange text-base">Goal van de Maand</p>
      <h1 className="font-display mb-6 text-5xl">Bevestig je stem</h1>
      {token ? <ConfirmForm token={token} /> : <p className="text-muted">Deze link is ongeldig.</p>}
    </section>
  );
}
