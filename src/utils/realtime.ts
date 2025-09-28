import type {
  SupabaseClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type PgEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type SubscribeOpts<Row> = {
  supabase: SupabaseClient;
  schema?: string;          // default: "public"
  table: string;
  event?: PgEvent;          // default: "*"
  filter?: string;          // e.g. "id=eq.123"
  onChange: (payload: RealtimePostgresChangesPayload<Row>) => void;
};

/**
 * Subscribe to Postgres row changes on a table.
 * Returns an unsubscribe function.
 */
export function subscribeToTable<Row = unknown>({
  supabase,
  schema = "public",
  table,
  event = "*",
  filter,
  onChange,
}: SubscribeOpts<Row>): () => void {
  const channelName = `table:${schema}.${table}${filter ? `:${filter}` : ""}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event, schema, table, filter },
      (payload: RealtimePostgresChangesPayload<Row>) => onChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Utility to safely remove a channel if it exists */
export function safeUnsubscribe(supabase: SupabaseClient, ch?: RealtimeChannel) {
  if (ch) supabase.removeChannel(ch);
}
