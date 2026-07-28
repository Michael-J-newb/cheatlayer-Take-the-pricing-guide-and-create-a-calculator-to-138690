export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          family_id: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at: string
          family_id: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          family_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      family_members: {
        Row: {
          family_id: string
          joined_at: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          family_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          family_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      geocode_cache: {
        Row: {
          created_at: string
          location_town: string | null
          rounded_lat: number
          rounded_lng: number
        }
        Insert: {
          created_at?: string
          location_town?: string | null
          rounded_lat: number
          rounded_lng: number
        }
        Update: {
          created_at?: string
          location_town?: string | null
          rounded_lat?: number
          rounded_lng?: number
        }
        Relationships: []
      }
      photo_likes: {
        Row: {
          created_at: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      photos: {
        Row: {
          captured_at: string | null
          captured_at_source: Database["public"]["Enums"]["capture_time_source"]
          checksum_sha256: string | null
          gps_lat: number | null
          gps_lng: number | null
          height: number | null
          id: string
          location_town: string | null
          mime_type: string
          original_filename: string
          preview_storage_path: string | null
          storage_path: string
          timeline_id: string
          uploaded_at: string
          uploader_id: string
          width: number | null
        }
        Insert: {
          captured_at?: string | null
          captured_at_source?: Database["public"]["Enums"]["capture_time_source"]
          checksum_sha256?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          height?: number | null
          id?: string
          location_town?: string | null
          mime_type: string
          original_filename: string
          preview_storage_path?: string | null
          storage_path: string
          timeline_id: string
          uploaded_at?: string
          uploader_id: string
          width?: number | null
        }
        Update: {
          captured_at?: string | null
          captured_at_source?: Database["public"]["Enums"]["capture_time_source"]
          checksum_sha256?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          height?: number | null
          id?: string
          location_town?: string | null
          mime_type?: string
          original_filename?: string
          preview_storage_path?: string | null
          storage_path?: string
          timeline_id?: string
          uploaded_at?: string
          uploader_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      timeline_views: {
        Row: {
          last_viewed_at: string
          timeline_id: string
          user_id: string
        }
        Insert: {
          last_viewed_at?: string
          timeline_id: string
          user_id: string
        }
        Update: {
          last_viewed_at?: string
          timeline_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_views_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      timelines: {
        Row: {
          cover_photo_id: string | null
          created_at: string
          created_by: string
          family_id: string
          id: string
          name: string
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          name: string
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "timelines_cover_photo_id_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timelines_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_family_creator: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_family_owner: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_photo_family_member: {
        Args: { _photo_id: string; _user_id: string }
        Returns: boolean
      }
      is_timeline_member: {
        Args: { _timeline_id: string; _user_id: string }
        Returns: boolean
      }
      join_family_with_code: {
        Args: { _code: string }
        Returns: string
      }
      shares_family_with: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      capture_time_source: "exif" | "upload_fallback"
      family_role: "owner" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
