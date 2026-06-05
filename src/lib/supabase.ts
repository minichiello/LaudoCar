import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Laudo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  ipfs_pdf_cid: string;
  ipfs_fotos_cid: string[];
  tx_hash: string;
  id_blockchain: number | null;
  created_at: string;
}

export async function getLaudos(): Promise<Laudo[]> {
  const { data, error } = await supabase
    .from("laudos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching laudos:", error);
    throw error;
  }

  return data || [];
}

export async function getLaudoById(id: string): Promise<Laudo | null> {
  const { data, error } = await supabase
    .from("laudos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching laudo:", error);
    return null;
  }

  return data;
}

export async function getLaudosByPlaca(placa: string): Promise<Laudo[]> {
  const { data, error } = await supabase
    .from("laudos")
    .select("*")
    .ilike("placa", `%${placa}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching laudos by placa:", error);
    throw error;
  }

  return data || [];
}

export async function createLaudo(laudo: Omit<Laudo, "id" | "created_at">): Promise<Laudo> {
  const { data, error } = await supabase
    .from("laudos")
    .insert([laudo])
    .select()
    .single();

  if (error) {
    console.error("Error creating laudo:", error);
    throw error;
  }

  return data;
}
