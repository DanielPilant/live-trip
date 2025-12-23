CREATE TABLE IF NOT EXISTS "public"."sites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "location" "jsonb" NOT NULL,
    "crowd_level" "text" DEFAULT 'low'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "polygon" json,
    CONSTRAINT "sites_crowd_level_check" CHECK (("crowd_level" = ANY (ARRAY['low'::"text", 'moderate'::"text", 'high'::"text", 'critical'::"text"])))
);
