
4. A bal menüben: **Credentials** -> **+ CREATE CREDENTIALS** -> **OAuth client ID**.
   - **Application type**: Web application.
   - **Authorized redirect URIs**: Ide kell beilleszteni azt a linket, amit a Supabase ad!
     - *Hol találod?* Supabase Dashboard -> Authentication -> Providers -> Google -> **Callback URL (for OAuth)**. (Valami ilyesmi: `https://<project-id>.supabase.co/auth/v1/callback`).

### 2. Adatok Másolása
Ha kész a Google Client, kapsz két kódot:
- **Client ID**
- **Client Secret**

### 3. Supabase Beállítás
1. Menj vissza a Supabase Dashboard-ra: **Authentication** -> **Providers** -> **Google**.
2. **Enabled**: Kapcsold be.
3. **Client ID**: Illeszd be a Google-től kapott ID-t.
4. **Client Secret**: Illeszd be a Google-től kapott titkos kódot.
5. Mentsd el (**Save**).

Kész! Most már működni fog a "Login with Google" gomb az oldaladon.
