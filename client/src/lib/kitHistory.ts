/**
 * Kit history tracking types.
 *
 * NOTE: The `kit_historico` table must be created manually in Supabase:
 *
 * CREATE TABLE kit_historico (
 *   id SERIAL PRIMARY KEY,
 *   "kitId" INTEGER NOT NULL REFERENCES "welcomeKits"(id) ON DELETE CASCADE,
 *   item TEXT NOT NULL,
 *   action TEXT NOT NULL CHECK (action IN ('entregue', 'removido')),
 *   "userName" TEXT NOT NULL,
 *   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * -- Enable RLS
 * ALTER TABLE kit_historico ENABLE ROW LEVEL SECURITY;
 *
 * -- Allow authenticated users full access
 * CREATE POLICY "Authenticated users can manage kit history"
 *   ON kit_historico FOR ALL
 *   TO authenticated
 *   USING (true) WITH CHECK (true);
 */

export interface KitHistoryEntry {
  id: number;
  kitId: number;
  item: string;
  action: 'entregue' | 'removido';
  userName: string;
  createdAt: string;
}
