#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Owner signs in through the Supabase browser flow; never paste credentials into chat.
supabase login
supabase link --project-ref xahuvoounkdojfsvnfaj
supabase functions deploy secure-game --project-ref xahuvoounkdojfsvnfaj
