# ASSOCIATE
- This repo contains the source code for Associate, a mobile app developed using Expo.


### Supabase
- `supabase login` - Login to Supabase
- `supabase link` - Link to Supabase
- `supabase db pull` (docker images get downloaded during first run, around 5-6GB) - Both for pulling the migrations initially and after making changes to the database
- Go to supabase table editor or sql editor -> create new schema or update any fields -> run the above command to get the migration details in a new file -> Run the below command to get the updated types
- `supabase gen types typescript --project-id <project-id> > types/supabase.ts` - Generate types for Supabase
