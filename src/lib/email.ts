import "server-only";

export async function sendVoteConfirmation(opts: {
  to: string;
  confirmUrl: string;
  playerName: string;
  roundTitle: string;
}) {
  const { to, confirmUrl, playerName, roundTitle } = opts;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 12px">Bevestig je stem ⚽</h2>
    <p>Je hebt gestemd op de goal van <strong>${escapeHtml(playerName)}</strong>
       voor de <strong>Goal van de Maand – ${escapeHtml(roundTitle)}</strong>.</p>
    <p>Klik op de knop om je stem te bevestigen. Pas daarna telt hij mee.</p>
    <p style="margin:28px 0">
      <a href="${confirmUrl}" style="background:#111;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">
        Bevestig mijn stem
      </a>
    </p>
    <p style="font-size:13px;color:#666">Heb jij niet gestemd? Dan kun je deze mail negeren.
      De link is 24 uur geldig.</p>
    <p style="font-size:13px;color:#666">VV Pernis</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Bevestig je stem – Goal van de Maand ${roundTitle}`,
      html,
      text: `Bevestig je stem op de goal van ${playerName} (Goal van de Maand ${roundTitle}): ${confirmUrl}`,
    }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    throw new Error("E-mail versturen mislukt");
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
