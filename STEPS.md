### Supabase
- [Important Note]: We need to turn ON Docker even if we don't use local supabase, for db pull and for deploying edge functions
- `supabase login` - Login to Supabase
- `supabase init` - Initialize a new Supabase project (Generate VS Code settings for Deno? => y)
- `supabase link` - Link to Supabase project on cloud
- `supabase gen types typescript --project-id <project-id> > types/supabase.ts` - Generate types for Supabase
- `supabase gen types typescript --project-id wntqnjihnnndgkmnlvqc > types/supabase.ts`
- `supabase db pull --linked` (docker images get downloaded during first run, around 5-6GB) - Both for pulling the migrations initially and after making changes to the database
- Go to supabase table editor or sql editor -> create new schema or update any fields -> run the above command to get the migration details in a new file -> Run the below command to get the updated types
- `supabase functions new test_func` - Create a new edge function
- Install VS Code extension for Deno
- Create a .env file inside ./supabase/functions dir
- `supabase secrets set --env-file ./supabase/functions/.env` - Set the environment variables for the edge functions in the cloud
- `supabase functions deploy` - Deploy the edge functions

### YouTube video for understanding Supabase Edge Functions
- https://www.youtube.com/live/wZpI3tD3L2E?si=5PamLlGVEjq8KvHo