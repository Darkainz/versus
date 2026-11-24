export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          created_at: string;
          district: string;
          id: string;
          instructions: string | null;
          is_default: boolean;
          label: string;
          landmark: string;
          phone: string;
          recipient_name: string;
          updated_at: string;
          user_id: string;
          zone_code: string;
        };
        ComputedFields: never;
        Insert: {
          city: string;
          created_at?: string;
          district: string;
          id?: string;
          instructions?: string | null;
          is_default?: boolean;
          label?: string;
          landmark: string;
          phone: string;
          recipient_name: string;
          updated_at?: string;
          user_id: string;
          zone_code: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          district?: string;
          id?: string;
          instructions?: string | null;
          is_default?: boolean;
          label?: string;
          landmark?: string;
          phone?: string;
          recipient_name?: string;
          updated_at?: string;
          user_id?: string;
          zone_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "addresses_zone_code_fkey";
            columns: ["zone_code"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["code"];
          },
        ];
      };
      brands: {
        Row: {
          name: string;
          position: number;
          slug: string;
          tagline: string;
        };
        ComputedFields: never;
        Insert: {
          name: string;
          position?: number;
          slug: string;
          tagline: string;
        };
        Update: {
          name?: string;
          position?: number;
          slug?: string;
          tagline?: string;
        };
        Relationships: [];
      };
      carts: {
        Row: {
          items: NonNullable<Json>;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          items?: NonNullable<Json>;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          items?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          compare_group: Database["public"]["Enums"]["compare_group"];
          intro: string;
          name: string;
          position: number;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          compare_group: Database["public"]["Enums"]["compare_group"];
          intro?: string;
          name: string;
          position?: number;
          slug: string;
        };
        Update: {
          compare_group?: Database["public"]["Enums"]["compare_group"];
          intro?: string;
          name?: string;
          position?: number;
          slug?: string;
        };
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          code: string;
          eta_label: string;
          eta_max_days: number | null;
          eta_min_days: number | null;
          fee_fcfa: number;
          free_from_fcfa: number | null;
          is_active: boolean;
          label: string;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          eta_label: string;
          eta_max_days?: number | null;
          eta_min_days?: number | null;
          fee_fcfa: number;
          free_from_fcfa?: number | null;
          is_active?: boolean;
          label: string;
          position?: number;
        };
        Update: {
          code?: string;
          eta_label?: string;
          eta_max_days?: number | null;
          eta_min_days?: number | null;
          fee_fcfa?: number;
          free_from_fcfa?: number | null;
          is_active?: boolean;
          label?: string;
          position?: number;
        };
        Relationships: [];
      };
      home_slots: {
        Row: {
          headline: string | null;
          id: string;
          is_active: boolean;
          position: number;
          product_id: string;
          slot: Database["public"]["Enums"]["home_slot_kind"];
          subline: string | null;
          theme_key: string;
        };
        ComputedFields: never;
        Insert: {
          headline?: string | null;
          id?: string;
          is_active?: boolean;
          position: number;
          product_id: string;
          slot: Database["public"]["Enums"]["home_slot_kind"];
          subline?: string | null;
          theme_key?: string;
        };
        Update: {
          headline?: string | null;
          id?: string;
          is_active?: boolean;
          position?: number;
          product_id?: string;
          slot?: Database["public"]["Enums"]["home_slot_kind"];
          subline?: string | null;
          theme_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "home_slots_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "home_slots_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          line_total_fcfa: number | null;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          sku: string;
          unit_price_fcfa: number;
          variant_id: string;
          variant_label: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          line_total_fcfa?: never;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          sku: string;
          unit_price_fcfa: number;
          variant_id: string;
          variant_label: string;
        };
        Update: {
          id?: string;
          line_total_fcfa?: never;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          quantity?: number;
          sku?: string;
          unit_price_fcfa?: number;
          variant_id?: string;
          variant_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          actor: Database["public"]["Enums"]["order_actor"];
          actor_id: string | null;
          created_at: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          id: number;
          note: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        ComputedFields: never;
        Insert: {
          actor: Database["public"]["Enums"]["order_actor"];
          actor_id?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: never;
          note?: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          actor?: Database["public"]["Enums"]["order_actor"];
          actor_id?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: never;
          note?: string | null;
          order_id?: string;
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_transitions: {
        Row: {
          actor: Database["public"]["Enums"]["order_actor"];
          from_status: Database["public"]["Enums"]["order_status"];
          to_status: Database["public"]["Enums"]["order_status"];
        };
        ComputedFields: never;
        Insert: {
          actor: Database["public"]["Enums"]["order_actor"];
          from_status: Database["public"]["Enums"]["order_status"];
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          actor?: Database["public"]["Enums"]["order_actor"];
          from_status?: Database["public"]["Enums"]["order_status"];
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [];
      };
      orders: {
        Row: {
          access_token_hash: string;
          anonymized_at: string | null;
          cancel_reason: string | null;
          cash_collected_at: string | null;
          city: string;
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string;
          district: string;
          eta_label: string;
          fictitious_ack_at: string;
          id: string;
          idempotency_key: string;
          instructions: string | null;
          landmark: string;
          number: string;
          payment_deadline: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          shipping_fcfa: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_fcfa: number;
          total_fcfa: number | null;
          updated_at: string;
          user_id: string | null;
          zone_code: string;
        };
        ComputedFields: never;
        Insert: {
          access_token_hash: string;
          anonymized_at?: string | null;
          cancel_reason?: string | null;
          cash_collected_at?: string | null;
          city: string;
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone: string;
          district: string;
          eta_label: string;
          fictitious_ack_at: string;
          id?: string;
          idempotency_key: string;
          instructions?: string | null;
          landmark: string;
          number?: string;
          payment_deadline?: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          shipping_fcfa: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_fcfa: number;
          total_fcfa?: never;
          updated_at?: string;
          user_id?: string | null;
          zone_code: string;
        };
        Update: {
          access_token_hash?: string;
          anonymized_at?: string | null;
          cancel_reason?: string | null;
          cash_collected_at?: string | null;
          city?: string;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string;
          district?: string;
          eta_label?: string;
          fictitious_ack_at?: string;
          id?: string;
          idempotency_key?: string;
          instructions?: string | null;
          landmark?: string;
          number?: string;
          payment_deadline?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          shipping_fcfa?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_fcfa?: number;
          total_fcfa?: never;
          updated_at?: string;
          user_id?: string | null;
          zone_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_zone_code_fkey";
            columns: ["zone_code"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["code"];
          },
        ];
      };
      payment_attempts: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          msisdn_masked: string | null;
          order_id: string;
          outcome: Database["public"]["Enums"]["attempt_outcome"];
          reference: string;
          resolved_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          msisdn_masked?: string | null;
          order_id: string;
          outcome?: Database["public"]["Enums"]["attempt_outcome"];
          reference: string;
          resolved_at?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          msisdn_masked?: string | null;
          order_id?: string;
          outcome?: Database["public"]["Enums"]["attempt_outcome"];
          reference?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt: string;
          color_slug: string | null;
          credit: string | null;
          height: number;
          id: string;
          is_primary: boolean;
          position: number;
          product_id: string;
          source_url: string | null;
          src: string;
          storage_path: string | null;
          width: number;
        };
        ComputedFields: never;
        Insert: {
          alt: string;
          color_slug?: string | null;
          credit?: string | null;
          height: number;
          id?: string;
          is_primary?: boolean;
          position?: number;
          product_id: string;
          source_url?: string | null;
          src: string;
          storage_path?: string | null;
          width: number;
        };
        Update: {
          alt?: string;
          color_slug?: string | null;
          credit?: string | null;
          height?: number;
          id?: string;
          is_primary?: boolean;
          position?: number;
          product_id?: string;
          source_url?: string | null;
          src?: string;
          storage_path?: string | null;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_specs: {
        Row: {
          autonomy_hours: number | null;
          battery_mah: number | null;
          charging_w: number | null;
          chip: string | null;
          has_5g: boolean | null;
          has_anc: boolean | null;
          ip_rating: string | null;
          main_camera_mp: number | null;
          product_id: string;
          refresh_hz: number | null;
          screen_size_in: number | null;
          screen_tech: string | null;
          specs_note: string;
          weight_g: number | null;
        };
        ComputedFields: never;
        Insert: {
          autonomy_hours?: number | null;
          battery_mah?: number | null;
          charging_w?: number | null;
          chip?: string | null;
          has_5g?: boolean | null;
          has_anc?: boolean | null;
          ip_rating?: string | null;
          main_camera_mp?: number | null;
          product_id: string;
          refresh_hz?: number | null;
          screen_size_in?: number | null;
          screen_tech?: string | null;
          specs_note?: string;
          weight_g?: number | null;
        };
        Update: {
          autonomy_hours?: number | null;
          battery_mah?: number | null;
          charging_w?: number | null;
          chip?: string | null;
          has_5g?: boolean | null;
          has_anc?: boolean | null;
          ip_rating?: string | null;
          main_camera_mp?: number | null;
          product_id?: string;
          refresh_hz?: number | null;
          screen_size_in?: number | null;
          screen_tech?: string | null;
          specs_note?: string;
          weight_g?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_specs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          color_hex: string | null;
          color_name: string;
          color_slug: string;
          id: string;
          is_active: boolean;
          is_default: boolean;
          low_stock_threshold: number;
          position: number;
          price_fcfa: number;
          product_id: string;
          size_mm: number | null;
          sku: string;
          stock: number;
          storage_gb: number | null;
        };
        ComputedFields: never;
        Insert: {
          color_hex?: string | null;
          color_name: string;
          color_slug: string;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          low_stock_threshold?: number;
          position?: number;
          price_fcfa: number;
          product_id: string;
          size_mm?: number | null;
          sku: string;
          stock?: number;
          storage_gb?: number | null;
        };
        Update: {
          color_hex?: string | null;
          color_name?: string;
          color_slug?: string;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          low_stock_threshold?: number;
          position?: number;
          price_fcfa?: number;
          product_id?: string;
          size_mm?: number | null;
          sku?: string;
          stock?: number;
          storage_gb?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          box_contents: string[];
          brand_slug: string;
          category_slug: string;
          code: string;
          compat: string[];
          created_at: string;
          description: string;
          id: string;
          is_active: boolean;
          name: string;
          new_until: string | null;
          release_date: string;
          slug: string;
          tagline: string;
          updated_at: string;
          visual_kind: Database["public"]["Enums"]["visual_kind"];
          warranty_months: number;
        };
        ComputedFields: never;
        Insert: {
          box_contents?: string[];
          brand_slug: string;
          category_slug: string;
          code: string;
          compat?: string[];
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          new_until?: string | null;
          release_date: string;
          slug: string;
          tagline: string;
          updated_at?: string;
          visual_kind: Database["public"]["Enums"]["visual_kind"];
          warranty_months?: number;
        };
        Update: {
          box_contents?: string[];
          brand_slug?: string;
          category_slug?: string;
          code?: string;
          compat?: string[];
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          new_until?: string | null;
          release_date?: string;
          slug?: string;
          tagline?: string;
          updated_at?: string;
          visual_kind?: Database["public"]["Enums"]["visual_kind"];
          warranty_months?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_slug_fkey";
            columns: ["brand_slug"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "products_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["slug"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      shop_settings: {
        Row: {
          attempt_ttl_seconds: number;
          banner_text: string;
          cod_max_fcfa: number;
          id: boolean;
          max_open_cod_per_phone: number;
          max_orders_per_hour: number;
          max_orders_per_phone_hour: number;
          max_qty_per_line: number;
          payment_ttl_minutes: number;
        };
        ComputedFields: never;
        Insert: {
          attempt_ttl_seconds?: number;
          banner_text: string;
          cod_max_fcfa?: number;
          id?: boolean;
          max_open_cod_per_phone?: number;
          max_orders_per_hour?: number;
          max_orders_per_phone_hour?: number;
          max_qty_per_line?: number;
          payment_ttl_minutes?: number;
        };
        Update: {
          attempt_ttl_seconds?: number;
          banner_text?: string;
          cod_max_fcfa?: number;
          id?: boolean;
          max_open_cod_per_phone?: number;
          max_orders_per_hour?: number;
          max_orders_per_phone_hour?: number;
          max_qty_per_line?: number;
          payment_ttl_minutes?: number;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          actor_id: string | null;
          created_at: string;
          delta: number;
          id: number;
          note: string | null;
          order_id: string | null;
          reason: Database["public"]["Enums"]["stock_reason"];
          stock_after: number;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          delta: number;
          id?: never;
          note?: string | null;
          order_id?: string | null;
          reason: Database["public"]["Enums"]["stock_reason"];
          stock_after: number;
          variant_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          delta?: number;
          id?: never;
          note?: string | null;
          order_id?: string | null;
          reason?: Database["public"]["Enums"]["stock_reason"];
          stock_after?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          granted_at: string;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Update: {
          granted_at?: string;
          role?: Database["public"]["Enums"]["user_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      catalog_products: {
        Row: {
          brand_name: string;
          brand_slug: string;
          category_slug: string;
          code: string;
          compare_group: Database["public"]["Enums"]["compare_group"];
          compat: string[];
          id: string;
          image_alt: string | null;
          image_height: number | null;
          image_src: string | null;
          image_width: number | null;
          in_stock: boolean | null;
          max_price_fcfa: number | null;
          min_price_fcfa: number | null;
          name: string;
          new_until: string | null;
          release_date: string;
          slug: string;
          tagline: string;
          visual_kind: Database["public"]["Enums"]["visual_kind"];
          warranty_months: number;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "products_brand_slug_fkey";
            columns: ["brand_slug"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "products_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["slug"];
          },
        ];
      };
    };
    Functions: {
      admin_adjust_stock: {
        Args: {
          p_delta: number;
          p_note?: string;
          p_reason: Database["public"]["Enums"]["stock_reason"];
          p_variant_id: string;
        };
        Returns: number;
      };
      admin_dashboard_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      admin_save_delivery_settings: { Args: { p_settings: Json; p_zones: Json }; Returns: boolean };
      admin_set_order_status: {
        Args: {
          p_cash_collected?: boolean;
          p_note?: string;
          p_order_id: string;
          p_to: Database["public"]["Enums"]["order_status"];
        };
        Returns: boolean;
      };
      admin_set_product_image_primary: {
        Args: { p_image_id: string; p_product_id: string };
        Returns: boolean;
      };
      admin_update_product_variant: {
        Args: {
          p_color_hex?: string;
          p_color_name: string;
          p_color_slug: string;
          p_is_active: boolean;
          p_is_default: boolean;
          p_low_stock_threshold: number;
          p_price_fcfa: number;
          p_product_id: string;
          p_size_mm?: number;
          p_sku: string;
          p_storage_gb?: number;
          p_variant_id: string;
        };
        Returns: boolean;
      };
      anonymize_my_account: { Args: Record<PropertyKey, never>; Returns: number };
      cancel_my_order: { Args: { p_number: string }; Returns: boolean };
      claim_guest_order: { Args: { p_number: string; p_token: string }; Returns: boolean };
      create_order: {
        Args: {
          p_customer: Json;
          p_delivery: Json;
          p_fictitious_ack: boolean;
          p_idempotency_key: string;
          p_items: Json;
          p_method: Database["public"]["Enums"]["payment_method"];
        };
        Returns: {
          access_token: string;
          order_number: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          status: Database["public"]["Enums"]["order_status"];
        }[];
      };
      expire_overdue_orders: { Args: Record<PropertyKey, never>; Returns: number };
      export_my_data: { Args: Record<PropertyKey, never>; Returns: Json };
      get_order_for_viewer: { Args: { p_number: string; p_token?: string }; Returns: Json };
      ping: { Args: Record<PropertyKey, never>; Returns: boolean };
      quote_cart: { Args: { p_items: Json; p_zone_code?: string }; Returns: Json };
      resolve_payment: {
        Args: {
          p_number: string;
          p_outcome: Database["public"]["Enums"]["attempt_outcome"];
          p_reference: string;
          p_token: string;
        };
        Returns: boolean;
      };
      start_payment: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"];
          p_msisdn?: string;
          p_number: string;
          p_token: string;
        };
        Returns: {
          expires_at: string;
          reference: string;
        }[];
      };
      track_order: { Args: { p_number: string; p_phone: string }; Returns: Json };
    };
    Enums: {
      attempt_outcome: "pending" | "succeeded" | "failed" | "expired";
      compare_group: "phones" | "audio" | "wearables";
      home_slot_kind: "hero" | "tile" | "rail" | "compare";
      order_actor: "customer" | "admin" | "system";
      order_status:
        "pending_payment" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
      payment_method: "tmoney" | "flooz" | "card" | "cash_on_delivery";
      payment_status:
        "pending" | "succeeded" | "failed" | "expired" | "cash_due" | "cash_collected";
      stock_reason: "order" | "order_cancelled" | "restock" | "correction" | "damage";
      user_role: "admin";
      visual_kind: "phone" | "watch" | "round" | "band" | "buds";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attempt_outcome: ["pending", "succeeded", "failed", "expired"],
      compare_group: ["phones", "audio", "wearables"],
      home_slot_kind: ["hero", "tile", "rail", "compare"],
      order_actor: ["customer", "admin", "system"],
      order_status: [
        "pending_payment",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: ["tmoney", "flooz", "card", "cash_on_delivery"],
      payment_status: ["pending", "succeeded", "failed", "expired", "cash_due", "cash_collected"],
      stock_reason: ["order", "order_cancelled", "restock", "correction", "damage"],
      user_role: ["admin"],
      visual_kind: ["phone", "watch", "round", "band", "buds"],
    },
  },
} as const;
