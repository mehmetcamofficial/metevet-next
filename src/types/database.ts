export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "veterinarian" | "staff";
export type PersonnelStatus = "active" | "inactive";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type ReminderStatus = "pending" | "ready" | "sent" | "cancelled" | "failed";
export type ReminderType = "appointment_upcoming" | "appointment_same_day" | "vaccine_due" | "vaccine_overdue" | "parasite_due" | "parasite_overdue" | "follow_up_due" | "custom";
export type ReminderChannel = "whatsapp" | "sms" | "email" | "internal";
export type DocumentType = "examination_summary"|"vaccination_card"|"parasite_summary"|"preventive_care_history"|"appointment_summary"|"pet_health_summary"|"follow_up_instructions"|"custom_clinical_note";
export type DocumentStatus = "generated"|"archived"|"failed";
export type PetSex = "female" | "male" | "unknown";
export type AppointmentSource = "website" | "plandok" | "whatsapp" | "phone" | "walk_in" | "admin";
export type ClosureType = "full_day" | "half_day" | "veterinarian_leave";
export type ConfirmationMode = "pending" | "confirmed";

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
          status: PersonnelStatus;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          status?: PersonnelStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      personnel_private_profiles: {
        Row: TimestampColumns & { id:string;email:string|null;phone:string|null };
        Insert: { id:string;email?:string|null;phone?:string|null;created_at?:string;updated_at?:string };
        Update: Partial<Database["public"]["Tables"]["personnel_private_profiles"]["Insert"]>;
        Relationships: [];
      };
      clinic_settings: {
        Row: { id:boolean;clinic_name_tr:string;clinic_name_en:string|null;authorized_veterinarian:string|null;phone:string|null;whatsapp:string|null;public_email:string|null;address_tr:string|null;address_en:string|null;map_url:string|null;website_url:string|null;registration_text:string|null;appointment_default_duration:number;appointment_min_duration:number;appointment_max_duration:number;appointment_buffer:number;appointment_default_status:AppointmentStatus;allow_past_appointments:boolean;conflict_policy:string;reminder_days_before:number[];reminder_send_hour:string;reminder_max_retry:number;whatsapp_enabled:boolean;email_enabled:boolean;sms_enabled:boolean;pdf_heading:string|null;logo_media_path:string|null;pdf_footer:string|null;signature_label:string|null;default_locale:"tr"|"en";timezone:string;exclude_internal_notes:boolean;created_at:string;updated_at:string;updated_by:string|null };
        Insert: Partial<Database["public"]["Tables"]["clinic_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["clinic_settings"]["Row"]>;
        Relationships: [];
      };
      clinic_business_hours: {
        Row: { weekday:number;is_open:boolean;opens_at:string|null;closes_at:string|null;break_starts_at:string|null;break_ends_at:string|null };
        Insert: Partial<Database["public"]["Tables"]["clinic_business_hours"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["clinic_business_hours"]["Row"]>;
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
          service_key: string;
          status: AppointmentStatus;
          starts_at: string;
          ends_at: string;
          reason: string | null;
          internal_notes: string | null;
          source: AppointmentSource;
          service_id: string | null;
          public_booking_reference: string | null;
          requested_veterinarian_id: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          pet_id: string;
          assigned_user_id?: string | null;
          service_key: string;
          status?: AppointmentStatus;
          starts_at: string;
          ends_at: string;
          reason?: string | null;
          internal_notes?: string | null;
          source?: AppointmentSource;
          service_id?: string | null;
          public_booking_reference?: string | null;
          requested_veterinarian_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      appointment_services: {
        Row: TimestampColumns & {
          id: string;
          name_tr: string;
          name_en: string;
          slug: string;
          description_tr: string | null;
          description_en: string | null;
          duration_minutes: number;
          buffer_before_minutes: number;
          buffer_after_minutes: number;
          is_online_bookable: boolean;
          requires_manual_confirmation: boolean;
          is_active: boolean;
          sort_order: number;
          created_by: string;
          updated_by: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name_tr: string;
          name_en: string;
          slug: string;
          description_tr?: string | null;
          description_en?: string | null;
          duration_minutes?: number;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          is_online_bookable?: boolean;
          requires_manual_confirmation?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_by: string;
          updated_by: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_services"]["Insert"]>;
        Relationships: [];
      };
      veterinarian_availability: {
        Row: TimestampColumns & {
          id: string;
          veterinarian_id: string;
          weekday: number;
          is_available: boolean;
          start_time: string | null;
          end_time: string | null;
          break_start: string | null;
          break_end: string | null;
          effective_from: string | null;
          effective_until: string | null;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          veterinarian_id: string;
          weekday: number;
          is_available?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          break_start?: string | null;
          break_end?: string | null;
          effective_from?: string | null;
          effective_until?: string | null;
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["veterinarian_availability"]["Insert"]>;
        Relationships: [];
      };
      clinic_closures: {
        Row: TimestampColumns & {
          id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          closure_type: ClosureType;
          affects_all_veterinarians: boolean;
          veterinarian_id: string | null;
          notes: string | null;
          created_by: string;
          updated_by: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          starts_at: string;
          ends_at: string;
          closure_type: ClosureType;
          affects_all_veterinarians?: boolean;
          veterinarian_id?: string | null;
          notes?: string | null;
          created_by: string;
          updated_by: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinic_closures"]["Insert"]>;
        Relationships: [];
      };
      booking_rules: {
        Row: {
          id: boolean;
          minimum_notice_minutes: number;
          maximum_advance_days: number;
          slot_interval_minutes: number;
          default_confirmation_mode: ConfirmationMode;
          allow_same_day_booking: boolean;
          require_email: boolean;
          require_phone: boolean;
          allow_first_available_veterinarian: boolean;
          cancellation_notice_minutes: number;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["booking_rules"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["booking_rules"]["Row"]>;
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
          parasite_record_id: string | null;
          examination_id: string | null;
          reminder_type: ReminderType;
          status: ReminderStatus;
          scheduled_for: string;
          channel: ReminderChannel;
          retry_count: number;
          recipient_name: string;
          recipient_phone: string | null;
          recipient_email: string | null;
          message_template_key: string | null;
          rendered_message: string | null;
          sent_at: string | null;
          failed_at: string | null;
          cancelled_at: string | null;
          failure_reason: string | null;
          metadata: Json;
          created_by: string | null;
          sent_by: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          pet_id?: string | null;
          appointment_id?: string | null;
          vaccine_record_id?: string | null;
          parasite_record_id?: string | null;
          examination_id?: string | null;
          reminder_type: ReminderType;
          status?: ReminderStatus;
          scheduled_for: string;
          channel: ReminderChannel;
          retry_count?: number;
          recipient_name: string;
          recipient_phone?: string | null;
          recipient_email?: string | null;
          message_template_key?: string | null;
          rendered_message?: string | null;
          sent_at?: string | null;
          failed_at?: string | null;
          cancelled_at?: string | null;
          failure_reason?: string | null;
          metadata?: Json;
          created_by?: string | null;
          sent_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
        Relationships: [];
      };
      reminder_templates: {
        Row: TimestampColumns & { id: string; key: string; name: string; channel: ReminderChannel; language: string; subject: string | null; body: string; is_active: boolean };
        Insert: { id?: string; key: string; name: string; channel: ReminderChannel; language: string; subject?: string | null; body: string; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["reminder_templates"]["Insert"]>;
        Relationships: [];
      };
      generated_documents: {
        Row: TimestampColumns & { id:string;document_type:DocumentType;owner_id:string|null;pet_id:string|null;appointment_id:string|null;examination_id:string|null;generated_by:string;title:string;language:"tr"|"en";status:DocumentStatus;file_name:string;storage_path:string|null;checksum:string|null;metadata:Json;generated_at:string;archived_at:string|null };
        Insert: { id?:string;document_type:DocumentType;owner_id?:string|null;pet_id?:string|null;appointment_id?:string|null;examination_id?:string|null;generated_by:string;title:string;language?:"tr"|"en";status?:DocumentStatus;file_name:string;storage_path?:string|null;checksum?:string|null;metadata?:Json;generated_at?:string;archived_at?:string|null;created_at?:string;updated_at?:string };
        Update: Partial<Database["public"]["Tables"]["generated_documents"]["Insert"]>;
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
      examinations: {
        Row: TimestampColumns & { id: string; pet_id: string; owner_id: string; appointment_id: string | null; veterinarian_id: string; status: "draft" | "finalized" | "archived"; visit_type: "general_exam" | "follow_up" | "vaccination" | "emergency" | "surgery_control" | "dental" | "other"; chief_complaint: string | null; history: string | null; examination_findings: string | null; assessment: string | null; diagnosis: string | null; procedures: string | null; treatment_plan: string | null; medications_notes: string | null; recommendations: string | null; follow_up_at: string | null; weight_kg: number | null; temperature_c: number | null; heart_rate: number | null; respiratory_rate: number | null; internal_notes: string | null; finalized_at: string | null; archived_at: string | null };
        Insert: { id?: string; pet_id: string; owner_id: string; appointment_id?: string | null; veterinarian_id: string; status?: "draft" | "finalized" | "archived"; visit_type: "general_exam" | "follow_up" | "vaccination" | "emergency" | "surgery_control" | "dental" | "other"; chief_complaint?: string | null; history?: string | null; examination_findings?: string | null; assessment?: string | null; diagnosis?: string | null; procedures?: string | null; treatment_plan?: string | null; medications_notes?: string | null; recommendations?: string | null; follow_up_at?: string | null; weight_kg?: number | null; temperature_c?: number | null; heart_rate?: number | null; respiratory_rate?: number | null; internal_notes?: string | null; finalized_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["examinations"]["Insert"]>;
        Relationships: [];
      };
      vaccination_records: { Row: TimestampColumns & { id:string;pet_id:string;owner_id:string;veterinarian_id:string|null;appointment_id:string|null;vaccine_name:string;manufacturer:string;batch_number:string;serial_number:string|null;dose_number:number;route:string;administration_date:string;next_due_date:string|null;status:"scheduled"|"completed"|"expired"|"cancelled";certificate_number:string|null;notes:string|null;internal_notes:string|null;archived_at:string|null }; Insert: { id?:string;pet_id:string;owner_id:string;veterinarian_id?:string|null;appointment_id?:string|null;vaccine_name:string;manufacturer:string;batch_number:string;serial_number?:string|null;dose_number:number;route:string;administration_date:string;next_due_date?:string|null;status:"scheduled"|"completed"|"expired"|"cancelled";certificate_number?:string|null;notes?:string|null;internal_notes?:string|null;archived_at?:string|null;created_at?:string;updated_at?:string }; Update: Partial<Database["public"]["Tables"]["vaccination_records"]["Insert"]>;Relationships:[] };
      parasite_records: { Row: TimestampColumns & { id:string;pet_id:string;owner_id:string;veterinarian_id:string|null;treatment_type:"internal"|"external"|"combined";product_name:string;batch_number:string|null;administration_date:string;next_due_date:string|null;status:"scheduled"|"completed"|"expired"|"cancelled";notes:string|null;internal_notes:string|null;archived_at:string|null }; Insert: { id?:string;pet_id:string;owner_id:string;veterinarian_id?:string|null;treatment_type:"internal"|"external"|"combined";product_name:string;batch_number?:string|null;administration_date:string;next_due_date?:string|null;status:"scheduled"|"completed"|"expired"|"cancelled";notes?:string|null;internal_notes?:string|null;archived_at?:string|null;created_at?:string;updated_at?:string }; Update: Partial<Database["public"]["Tables"]["parasite_records"]["Insert"]>;Relationships:[] };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole | null };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_clinical_staff: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      create_public_booking: { Args: { payload: Record<string, unknown> }; Returns: Record<string, unknown> };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      pet_sex: PetSex;
      reminder_status: ReminderStatus;
      user_role: UserRole;
      personnel_status: PersonnelStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
