/**
 * profile.types.ts
 * 
 * TypeScript types for the user profile feature.
 */

import type { Database } from '@/lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
