# VV Pernis – Goal van de Maand

Website waar supporters maandelijks stemmen op de mooiste goal van VV Pernis.

- **Supporters** bekijken de genomineerde goals en stemmen met hun e-mailadres: één stem per adres per ronde, die ze bevestigen via een link in de mail.
- **Uitslag** blijft verborgen tot de admin de winnaar aanwijst. Daarna verschijnt de uitslag op de homepage en de winnaar in het archief (`/archief`).
- **Admin** (`/admin`): rondes aanmaken, video's uploaden, live stemmen volgen en de winnaar aanwijzen.

Techniek: Next.js · Supabase (database, login, video-opslag) · Resend (e-mail) · Vercel (hosting).

## Installatie (eenmalig)

### 1. Supabase
1. Maak een nieuw project aan op [supabase.com](https://supabase.com).
2. Ga naar **SQL Editor → New query**, plak de inhoud van [`supabase/schema.sql`](supabase/schema.sql) en klik **Run**.
3. Ga naar **Authentication → Users → Add user → Create new user** en maak je eigen admin-account aan (e-mail + wachtwoord, vink *Auto confirm* aan).
4. Maak jezelf admin in de SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'jouw@email.nl';
   ```
5. Kopieer uit **Project Settings → API** de *Project URL*, de *anon public key* en de *service_role key*.

### 2. Resend (bevestigingsmails)
1. Maak een account op [resend.com](https://resend.com). Het gratis plan geeft 3.000 mails per maand, met een maximum van 100 per dag.
2. Voeg onder **Domains** je domein toe (bv. `vvpernis.nl`) en zet de DNS-records die Resend geeft. Zonder geverifieerd domein kan Resend alleen naar je eigen adres mailen.
3. Maak een **API key** aan.

### 3. Vercel
1. **Add New → Project** → importeer deze GitHub-repo.
2. Voeg onder **Environment Variables** alles uit [`.env.example`](.env.example) toe met je echte waarden.
3. Deploy. Koppel eventueel een (sub)domein onder **Settings → Domains**.

## Gebruik per maand
1. Ga naar `/admin` en maak een nieuwe ronde (bv. "Oktober 2026") met een open- en sluitmoment.
2. Upload de genomineerde goals: staande video's, maximaal 50 MB per stuk.
3. Vink **Gepubliceerd** aan, dan staat de ronde live.
4. Bekijk na sluiting de stemmen in het admin-paneel en klik **Wijs aan als winnaar**. De uitslag wordt dan openbaar.

## Huisstijl aanpassen
- Kleuren: bovenaan [`src/app/globals.css`](src/app/globals.css) (`--club-primary`, `--club-accent`).
- Logo: zet `logo.png` in `public/` en vervang de "VVP"-cirkel in [`src/app/layout.tsx`](src/app/layout.tsx).

## Lokaal ontwikkelen
```bash
cp .env.example .env.local   # vul waarden in
npm install
npm run dev
```

## Anti-fraude
- Een stem telt pas na een klik op de bevestigingslink, die 24 uur geldig is. Bevestigen gaat via een knop, zodat mail-scanners niet automatisch stemmen.
- E-mailadressen worden genormaliseerd: `Jan.Jansen+1@gmail.com` telt als `janjansen@gmail.com`.
- Per IP-adres zijn maximaal 15 stempogingen per uur toegestaan. Het IP-adres wordt gehasht opgeslagen. Een honeypot-veld houdt bots tegen.
