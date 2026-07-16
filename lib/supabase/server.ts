// lib/supabase/server.ts
//import { createServerClient } from '@supabase/ssr';
//import { cookies } from 'next/headers';

//export function createClient() {
  // ✅ This function must be called inside a request context
  //const cookieStore = cookies();
  
  //return createServerClient(
    //process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //{
      //cookies: {
        //get(name: string) {
          //return cookieStore.get(name)?.value;
       // },
        //set(name: string, value: string, options: any) {
         // cookieStore.set({ name, value, ...options });
        //},
        //remove(name: string, options: any) {
         // cookieStore.set({ name, value: '', ...options });
        //},
      //},
   // }
  //);
//}
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient(cookieStore?: any) {
  // Use provided cookieStore or get from headers
  const store = cookieStore || cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          store.set({ name, value: '', ...options });
        },
      },
    }
  );
}