export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_archives: {
        Row: {
          compressed_size_bytes: number
          created_at: string
          file_name: string
          first_log_at: string | null
          id: string
          last_log_at: string | null
          log_count: number
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          compressed_size_bytes?: number
          created_at?: string
          file_name: string
          first_log_at?: string | null
          id?: string
          last_log_at?: string | null
          log_count?: number
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          compressed_size_bytes?: number
          created_at?: string
          file_name?: string
          first_log_at?: string | null
          id?: string
          last_log_at?: string | null
          log_count?: number
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: number
          ip_address: string | null
          target_id: string | null
          target_name: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: number
          ip_address?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: number
          ip_address?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      discovered_tools: {
        Row: {
          approved_tool_id: number | null
          canonical_url: string | null
          category: string | null
          created_at: string
          description: string | null
          discovery_score: number | null
          duplicate_of_discovered_tool_id: string | null
          duplicate_of_tool_id: number | null
          id: string
          logo_url: string | null
          name: string
          normalized_domain: string | null
          platforms: string[] | null
          pricing: string | null
          raw_payload: Json
          rejected_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          run_id: string | null
          slug: string | null
          source_id: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          approved_tool_id?: number | null
          canonical_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          discovery_score?: number | null
          duplicate_of_discovered_tool_id?: string | null
          duplicate_of_tool_id?: number | null
          id?: string
          logo_url?: string | null
          name: string
          normalized_domain?: string | null
          platforms?: string[] | null
          pricing?: string | null
          raw_payload?: Json
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          run_id?: string | null
          slug?: string | null
          source_id?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          approved_tool_id?: number | null
          canonical_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          discovery_score?: number | null
          duplicate_of_discovered_tool_id?: string | null
          duplicate_of_tool_id?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          normalized_domain?: string | null
          platforms?: string[] | null
          pricing?: string | null
          raw_payload?: Json
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          run_id?: string | null
          slug?: string | null
          source_id?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_tools_approved_tool_id_fkey"
            columns: ["approved_tool_id"]
            isOneToOne: false
            referencedRelation: "public_safe_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_tools_approved_tool_id_fkey"
            columns: ["approved_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_tools_duplicate_of_discovered_tool_id_fkey"
            columns: ["duplicate_of_discovered_tool_id"]
            isOneToOne: false
            referencedRelation: "discovered_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_tools_duplicate_of_tool_id_fkey"
            columns: ["duplicate_of_tool_id"]
            isOneToOne: false
            referencedRelation: "public_safe_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_tools_duplicate_of_tool_id_fkey"
            columns: ["duplicate_of_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_tools_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_tools_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string
          created_at: string
          discovered_tool_id: string | null
          id: string
          message: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label: string
          created_at?: string
          discovered_tool_id?: string | null
          id?: string
          message: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string
          created_at?: string
          discovered_tool_id?: string | null
          id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "discovery_audit_events_discovered_tool_id_fkey"
            columns: ["discovered_tool_id"]
            isOneToOne: false
            referencedRelation: "discovered_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_candidate_preview_artifacts: {
        Row: {
          audit_correlation_id: string
          candidate_name: string | null
          candidate_website_url: string | null
          category_hint: string | null
          confidence_bucket: string | null
          created_at: string
          discovery_run_id: string
          discovery_source_id: string
          evidence_summary: string | null
          id: string
          preview_generated_at: string | null
          preview_schema_version: string
          preview_status: string
          pricing_hint: string | null
          safety_flags: string[]
          source_evidence_locator: string | null
          source_url_snapshot: string | null
          updated_at: string
        }
        Insert: {
          audit_correlation_id?: string
          candidate_name?: string | null
          candidate_website_url?: string | null
          category_hint?: string | null
          confidence_bucket?: string | null
          created_at?: string
          discovery_run_id: string
          discovery_source_id: string
          evidence_summary?: string | null
          id?: string
          preview_generated_at?: string | null
          preview_schema_version?: string
          preview_status?: string
          pricing_hint?: string | null
          safety_flags?: string[]
          source_evidence_locator?: string | null
          source_url_snapshot?: string | null
          updated_at?: string
        }
        Update: {
          audit_correlation_id?: string
          candidate_name?: string | null
          candidate_website_url?: string | null
          category_hint?: string | null
          confidence_bucket?: string | null
          created_at?: string
          discovery_run_id?: string
          discovery_source_id?: string
          evidence_summary?: string | null
          id?: string
          preview_generated_at?: string | null
          preview_schema_version?: string
          preview_status?: string
          pricing_hint?: string | null
          safety_flags?: string[]
          source_evidence_locator?: string | null
          source_url_snapshot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_candidate_preview_artifacts_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_preview_artifacts_discovery_source_id_fkey"
            columns: ["discovery_source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_candidate_tools: {
        Row: {
          archived_at: string | null
          audit_correlation_id: string
          candidate_app_links: string[]
          candidate_canonical_url: string
          candidate_category_hint: string | null
          candidate_description: string | null
          candidate_name: string
          candidate_normalized_domain: string
          candidate_platform_hints: string[]
          candidate_pricing_hint: string | null
          candidate_social_links: string[]
          candidate_status: string
          candidate_website_url: string
          cleanup_status: string
          confidence_bucket: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_action: string | null
          decision_notes: string | null
          decision_reason: string | null
          discovery_run_id: string
          discovery_source_id: string | null
          duplicate_blocking: boolean
          duplicate_check_status: string
          duplicate_checked_at: string | null
          duplicate_of_candidate_id: string | null
          duplicate_of_tool_id: number | null
          duplicate_signal_types: string[]
          eligible_for_cleanup_at: string | null
          evidence_summary: string | null
          extraction_mode: string
          extraction_version: string
          id: string
          possible_duplicate_candidate_id: string | null
          possible_duplicate_discovered_tool_id: string | null
          possible_duplicate_tool_id: number | null
          rejection_reason_code: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_flags: string[]
          source_domain: string | null
          source_evidence_kind: string
          source_evidence_locator: string | null
          source_url: string
          source_url_normalized: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          audit_correlation_id?: string
          candidate_app_links?: string[]
          candidate_canonical_url: string
          candidate_category_hint?: string | null
          candidate_description?: string | null
          candidate_name: string
          candidate_normalized_domain: string
          candidate_platform_hints?: string[]
          candidate_pricing_hint?: string | null
          candidate_social_links?: string[]
          candidate_status?: string
          candidate_website_url: string
          cleanup_status?: string
          confidence_bucket?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_action?: string | null
          decision_notes?: string | null
          decision_reason?: string | null
          discovery_run_id: string
          discovery_source_id?: string | null
          duplicate_blocking?: boolean
          duplicate_check_status?: string
          duplicate_checked_at?: string | null
          duplicate_of_candidate_id?: string | null
          duplicate_of_tool_id?: number | null
          duplicate_signal_types?: string[]
          eligible_for_cleanup_at?: string | null
          evidence_summary?: string | null
          extraction_mode: string
          extraction_version: string
          id?: string
          possible_duplicate_candidate_id?: string | null
          possible_duplicate_discovered_tool_id?: string | null
          possible_duplicate_tool_id?: number | null
          rejection_reason_code?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: string[]
          source_domain?: string | null
          source_evidence_kind?: string
          source_evidence_locator?: string | null
          source_url: string
          source_url_normalized: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          audit_correlation_id?: string
          candidate_app_links?: string[]
          candidate_canonical_url?: string
          candidate_category_hint?: string | null
          candidate_description?: string | null
          candidate_name?: string
          candidate_normalized_domain?: string
          candidate_platform_hints?: string[]
          candidate_pricing_hint?: string | null
          candidate_social_links?: string[]
          candidate_status?: string
          candidate_website_url?: string
          cleanup_status?: string
          confidence_bucket?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_action?: string | null
          decision_notes?: string | null
          decision_reason?: string | null
          discovery_run_id?: string
          discovery_source_id?: string | null
          duplicate_blocking?: boolean
          duplicate_check_status?: string
          duplicate_checked_at?: string | null
          duplicate_of_candidate_id?: string | null
          duplicate_of_tool_id?: number | null
          duplicate_signal_types?: string[]
          eligible_for_cleanup_at?: string | null
          evidence_summary?: string | null
          extraction_mode?: string
          extraction_version?: string
          id?: string
          possible_duplicate_candidate_id?: string | null
          possible_duplicate_discovered_tool_id?: string | null
          possible_duplicate_tool_id?: number | null
          rejection_reason_code?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: string[]
          source_domain?: string | null
          source_evidence_kind?: string
          source_evidence_locator?: string | null
          source_url?: string
          source_url_normalized?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_candidate_tools_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_discovery_source_id_fkey"
            columns: ["discovery_source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_duplicate_of_candidate_id_fkey"
            columns: ["duplicate_of_candidate_id"]
            isOneToOne: false
            referencedRelation: "discovery_candidate_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_duplicate_of_tool_id_fkey"
            columns: ["duplicate_of_tool_id"]
            isOneToOne: false
            referencedRelation: "public_safe_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_duplicate_of_tool_id_fkey"
            columns: ["duplicate_of_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_possible_duplicate_candidate_id_fkey"
            columns: ["possible_duplicate_candidate_id"]
            isOneToOne: false
            referencedRelation: "discovery_candidate_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_possible_duplicate_discovered_to_fkey"
            columns: ["possible_duplicate_discovered_tool_id"]
            isOneToOne: false
            referencedRelation: "discovered_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_possible_duplicate_tool_id_fkey"
            columns: ["possible_duplicate_tool_id"]
            isOneToOne: false
            referencedRelation: "public_safe_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_candidate_tools_possible_duplicate_tool_id_fkey"
            columns: ["possible_duplicate_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_duplicate_candidates: {
        Row: {
          candidate_discovered_tool_id: string | null
          candidate_submission_id: number | null
          candidate_tool_id: number | null
          candidate_type: string
          created_at: string
          discovered_tool_id: string
          id: string
          is_blocking: boolean
          match_score: number
          match_type: string
          reason: string | null
        }
        Insert: {
          candidate_discovered_tool_id?: string | null
          candidate_submission_id?: number | null
          candidate_tool_id?: number | null
          candidate_type: string
          created_at?: string
          discovered_tool_id: string
          id?: string
          is_blocking?: boolean
          match_score?: number
          match_type: string
          reason?: string | null
        }
        Update: {
          candidate_discovered_tool_id?: string | null
          candidate_submission_id?: number | null
          candidate_tool_id?: number | null
          candidate_type?: string
          created_at?: string
          discovered_tool_id?: string
          id?: string
          is_blocking?: boolean
          match_score?: number
          match_type?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_duplicate_candidate_candidate_discovered_tool_id_fkey"
            columns: ["candidate_discovered_tool_id"]
            isOneToOne: false
            referencedRelation: "discovered_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_duplicate_candidates_candidate_submission_id_fkey"
            columns: ["candidate_submission_id"]
            isOneToOne: false
            referencedRelation: "submitted_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_duplicate_candidates_candidate_tool_id_fkey"
            columns: ["candidate_tool_id"]
            isOneToOne: false
            referencedRelation: "public_safe_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_duplicate_candidates_candidate_tool_id_fkey"
            columns: ["candidate_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_duplicate_candidates_discovered_tool_id_fkey"
            columns: ["discovered_tool_id"]
            isOneToOne: false
            referencedRelation: "discovered_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_evidence: {
        Row: {
          confidence_score: number | null
          content_hash: string | null
          created_at: string
          discovered_tool_id: string
          extracted_json: Json
          fetched_at: string | null
          final_url: string | null
          id: string
          logo_url: string | null
          meta_description: string | null
          page_title: string | null
          pricing_text: string | null
          raw_html_storage_path: string | null
          screenshot_storage_path: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          content_hash?: string | null
          created_at?: string
          discovered_tool_id: string
          extracted_json?: Json
          fetched_at?: string | null
          final_url?: string | null
          id?: string
          logo_url?: string | null
          meta_description?: string | null
          page_title?: string | null
          pricing_text?: string | null
          raw_html_storage_path?: string | null
          screenshot_storage_path?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          content_hash?: string | null
          created_at?: string
          discovered_tool_id?: string
          extracted_json?: Json
          fetched_at?: string | null
          final_url?: string | null
          id?: string
          logo_url?: string | null
          meta_description?: string | null
          page_title?: string | null
          pricing_text?: string | null
          raw_html_storage_path?: string | null
          screenshot_storage_path?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_evidence_discovered_tool_id_fkey"
            columns: ["discovered_tool_id"]
            isOneToOne: false
            referencedRelation: "discovered_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_runs: {
        Row: {
          created_at: string
          error_log: string | null
          finished_at: string | null
          id: string
          source_id: string | null
          started_at: string | null
          stats: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_log?: string | null
          finished_at?: string | null
          id?: string
          source_id?: string | null
          started_at?: string | null
          stats?: Json
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_log?: string | null
          finished_at?: string | null
          id?: string
          source_id?: string | null
          started_at?: string | null
          stats?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "discovery_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_sources: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          slug: string
          source_type: string
          status: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          slug: string
          source_type: string
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          slug?: string
          source_type?: string
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      homepage_control_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string
          config_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label: string
          config_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string
          config_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "homepage_control_audit_events_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "homepage_control_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_control_audit_events_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "public_homepage_control_config"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_control_checklist_runs: {
        Row: {
          checklist: Json
          completed_at: string | null
          completed_by: string | null
          config_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          checklist?: Json
          completed_at?: string | null
          completed_by?: string | null
          config_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          checklist?: Json
          completed_at?: string | null
          completed_by?: string | null
          config_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_control_checklist_runs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "homepage_control_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_control_checklist_runs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "public_homepage_control_config"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_control_configs: {
        Row: {
          config: Json
          content: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          pre_publish_checklist: Json
          published_at: string | null
          published_by: string | null
          status: string
          tool_placements: Json
          updated_at: string
          updated_by: string | null
          validation_errors: Json
          validation_warnings: Json
          version: number
        }
        Insert: {
          config?: Json
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          pre_publish_checklist?: Json
          published_at?: string | null
          published_by?: string | null
          status: string
          tool_placements?: Json
          updated_at?: string
          updated_by?: string | null
          validation_errors?: Json
          validation_warnings?: Json
          version: number
        }
        Update: {
          config?: Json
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          pre_publish_checklist?: Json
          published_at?: string | null
          published_by?: string | null
          status?: string
          tool_placements?: Json
          updated_at?: string
          updated_by?: string | null
          validation_errors?: Json
          validation_warnings?: Json
          version?: number
        }
        Relationships: []
      }
      submitted_tools: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: number
          logo_url: string | null
          name: string
          normalized_domain: string | null
          pricing: string | null
          status: string
          submitter_email: string | null
          submitter_name: string | null
          website: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: never
          logo_url?: string | null
          name: string
          normalized_domain?: string | null
          pricing?: string | null
          status?: string
          submitter_email?: string | null
          submitter_name?: string | null
          website: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: never
          logo_url?: string | null
          name?: string
          normalized_domain?: string | null
          pricing?: string | null
          status?: string
          submitter_email?: string | null
          submitter_name?: string | null
          website?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          android: string | null
          best_for: string | null
          category: string
          created_at: string | null
          deleted_at: string | null
          description: string
          featured: boolean | null
          id: number
          ios: string | null
          logo_url: string | null
          name: string
          normalized_domain: string | null
          platforms: string[] | null
          pricing: string | null
          slug: string
          status: string
          updated_at: string
          use_cases: string[]
          website: string
        }
        Insert: {
          android?: string | null
          best_for?: string | null
          category: string
          created_at?: string | null
          deleted_at?: string | null
          description: string
          featured?: boolean | null
          id?: never
          ios?: string | null
          logo_url?: string | null
          name: string
          normalized_domain?: string | null
          platforms?: string[] | null
          pricing?: string | null
          slug: string
          status?: string
          updated_at?: string
          use_cases?: string[]
          website: string
        }
        Update: {
          android?: string | null
          best_for?: string | null
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          featured?: boolean | null
          id?: never
          ios?: string | null
          logo_url?: string | null
          name?: string
          normalized_domain?: string | null
          platforms?: string[] | null
          pricing?: string | null
          slug?: string
          status?: string
          updated_at?: string
          use_cases?: string[]
          website?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_homepage_control_config: {
        Row: {
          config: Json | null
          content: Json | null
          id: string | null
          published_at: string | null
          tool_placements: Json | null
          updated_at: string | null
          version: number | null
        }
        Relationships: []
      }
      public_safe_tools: {
        Row: {
          android: string | null
          best_for: string | null
          category: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: number | null
          ios: string | null
          logo_url: string | null
          name: string | null
          platforms: string[] | null
          pricing: string | null
          slug: string | null
          updated_at: string | null
          use_cases: string[] | null
          website: string | null
        }
        Insert: {
          android?: string | null
          best_for?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: number | null
          ios?: string | null
          logo_url?: string | null
          name?: string | null
          platforms?: string[] | null
          pricing?: string | null
          slug?: string | null
          updated_at?: string | null
          use_cases?: string[] | null
          website?: string | null
        }
        Update: {
          android?: string | null
          best_for?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: number | null
          ios?: string | null
          logo_url?: string | null
          name?: string | null
          platforms?: string[] | null
          pricing?: string | null
          slug?: string | null
          updated_at?: string | null
          use_cases?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_apply_discovery_candidate_decision: {
        Args: {
          p_action: string
          p_actor_label?: string
          p_candidate_id: string
          p_duplicate_of_candidate_id?: string
          p_duplicate_of_tool_id?: number
          p_notes?: string
          p_reason: string
          p_request_correlation_id?: string
        }
        Returns: {
          candidate_status: string
          decided_at: string
          decided_by: string
          decision_action: string
          decision_notes: string
          decision_reason: string
          duplicate_of_candidate_id: string
          duplicate_of_tool_id: number
          id: string
        }[]
      }
      aifinder_tool_slug: { Args: { name_value: string }; Returns: string }
      approve_discovered_tool: {
        Args: {
          p_actor_id?: string
          p_actor_label?: string
          p_discovered_tool_id: string
        }
        Returns: number
      }
      approve_submitted_tool: {
        Args: { submission_id: number }
        Returns: number
      }
      is_current_approved_submission: {
        Args: { domain_value: string; submission_id: number }
        Returns: boolean
      }
      normalize_tool_domain: {
        Args: { website_value: string }
        Returns: string
      }
      publish_homepage_control_config: {
        Args: { p_actor_id: string; p_actor_label: string; p_config_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
