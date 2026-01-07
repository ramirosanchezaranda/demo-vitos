import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      flavors: {
        Row: {
          id: string;
          name: string;
          plu: string | null;
          price_per_kg: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plu?: string | null;
          price_per_kg?: number | null;
          sort_order: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plu?: string | null;
          price_per_kg?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      movements: {
        Row: {
          id: string;
          created_at: string;
          flow: 'in' | 'out';
          flavor_name: string;
          barcode: string;
          raw: string;
          weight_kg: number | null;
          price_per_kg: number | null;
          total: number | null;
          status: 'ok' | 'void' | 'corrected';
        };
        Insert: {
          id?: string;
          created_at?: string;
          flow: 'in' | 'out';
          flavor_name: string;
          barcode: string;
          raw: string;
          weight_kg?: number | null;
          price_per_kg?: number | null;
          total?: number | null;
          status?: 'ok' | 'void' | 'corrected';
        };
        Update: {
          id?: string;
          created_at?: string;
          flow?: 'in' | 'out';
          flavor_name?: string;
          barcode?: string;
          raw?: string;
          weight_kg?: number | null;
          price_per_kg?: number | null;
          total?: number | null;
          status?: 'ok' | 'void' | 'corrected';
        };
      };
    };
  };
};
