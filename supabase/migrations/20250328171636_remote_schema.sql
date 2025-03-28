create table "public"."user_status" (
    "id" uuid not null,
    "user_type" text not null,
    "is_online" boolean default false,
    "last_active" timestamp with time zone default now(),
    "domain" text
);


CREATE INDEX user_status_domain_idx ON public.user_status USING btree (domain);

CREATE INDEX user_status_online_idx ON public.user_status USING btree (is_online);

CREATE UNIQUE INDEX user_status_pkey ON public.user_status USING btree (id);

CREATE INDEX user_status_type_idx ON public.user_status USING btree (user_type);

alter table "public"."user_status" add constraint "user_status_pkey" PRIMARY KEY using index "user_status_pkey";

alter table "public"."user_status" add constraint "user_status_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."user_status" validate constraint "user_status_id_fkey";

alter table "public"."user_status" add constraint "user_status_user_type_check" CHECK ((user_type = ANY (ARRAY['user'::text, 'advisor'::text]))) not valid;

alter table "public"."user_status" validate constraint "user_status_user_type_check";

grant delete on table "public"."user_status" to "anon";

grant insert on table "public"."user_status" to "anon";

grant references on table "public"."user_status" to "anon";

grant select on table "public"."user_status" to "anon";

grant trigger on table "public"."user_status" to "anon";

grant truncate on table "public"."user_status" to "anon";

grant update on table "public"."user_status" to "anon";

grant delete on table "public"."user_status" to "authenticated";

grant insert on table "public"."user_status" to "authenticated";

grant references on table "public"."user_status" to "authenticated";

grant select on table "public"."user_status" to "authenticated";

grant trigger on table "public"."user_status" to "authenticated";

grant truncate on table "public"."user_status" to "authenticated";

grant update on table "public"."user_status" to "authenticated";

grant delete on table "public"."user_status" to "service_role";

grant insert on table "public"."user_status" to "service_role";

grant references on table "public"."user_status" to "service_role";

grant select on table "public"."user_status" to "service_role";

grant trigger on table "public"."user_status" to "service_role";

grant truncate on table "public"."user_status" to "service_role";

grant update on table "public"."user_status" to "service_role";


