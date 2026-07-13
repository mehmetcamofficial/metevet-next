export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "veterinarian" | "staff";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type ReminderStatus = "pending" | "sent" | "cancelled" | "failed";
export type PetSex = "female" | "male" | "unknown";

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: TimestampColumns & {
          id: string;
          full_name: string;
          role: UserRole;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      owners: {
        Row: TimestampColumns & {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          notes: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["owners"]["Insert"]>;
        Relationships: [];
      };
      pets: {
        Row: TimestampColumns & {
          id: string;
          owner_id: string;
          name: string;
          species: string;
          breed: string | null;
          birth_date: string | null;
          sex: PetSex;
          microchip_number: string | null;
          notes: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          species: string;
          breed?: string | null;
          birth_date?: string | null;
          sex?: PetSex;
          microchip_number?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pets"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: TimestampColumns & {
          id: string;
          owner_id: string;
          pet_id: string;
          assigned_user_id: string | null;
          status: AppointmentStatus;
          starts_at: string;
          ends_at: string;
          reason: string | null;
          notes: string | null;
          source: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          pet_id: string;
          assigned_user_id?: string | null;
          status?: AppointmentStatus;
          starts_at: string;
          ends_at: string;
          reason?: string | null;
          notes?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      vaccine_records: {
        Row: TimestampColumns & {
          id: string;
          pet_id: string;
          administered_by: string | null;
          vaccine_name: string;
          administered_at: string;
          next_due_at: string | null;
          batch_number: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          pet_id: string;
          administered_by?: string | null;
          vaccine_name: string;
          administered_at: string;
          next_due_at?: string | null;
          batch_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vaccine_records"]["Insert"]>;
        Relationships: [];
      };
      reminders: {
        Row: TimestampColumns & {
          id: string;
          owner_id: string;
          pet_id: string | null;
          appointment_id: string | null;
          vaccine_record_id: string | null;
          status: ReminderStatus;
          remind_at: string;
          channel: string;
          message: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          pet_id?: string | null;
          appointment_id?: string | null;
          vaccine_record_id?: string | null;
          status?: ReminderStatus;
          remind_at: string;
          channel: string;
          message: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole | null };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_clinical_staff: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      pet_sex: PetSex;
      reminder_status: ReminderStatus;
      user_role: UserRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
