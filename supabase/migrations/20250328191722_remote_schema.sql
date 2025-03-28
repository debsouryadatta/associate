alter table "public"."user_status" drop constraint "user_status_id_fkey";

alter table "public"."user_status" add constraint "user_status_id_fkey" FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_status" validate constraint "user_status_id_fkey";


