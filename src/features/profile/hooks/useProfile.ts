/**
 * useProfile.ts
 * 
 * Hook for fetching and updating user profile data.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Profile } from '@/features/profile/profile.types';

async function getProfile(): Promise<Profile | null> {
  const userId = await requireAuth();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // If profile doesn't exist, create one
    if (error.code === 'PGRST116') {
      console.log('Profile not found, creating default profile...');
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            birth_date: '1990-01-01',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw new Error(createError.message);
        }

        return newProfile;
      } catch (createError) {
        console.error('Error creating profile:', createError);
        throw createError;
      }
    }
    
    console.error('Error fetching profile:', error);
    throw new Error(error.message);
  }

  return data;
}

async function updateProfile(updatedProfile: Partial<Profile>): Promise<Profile | null> {
  const userId = await requireAuth();
  const { data, error } = await supabase
    .from('profiles')
    .update(updatedProfile)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message);
  }

  return data;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { mutateAsync: updateProfileMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      // Invalidate related queries if necessary
      queryClient.invalidateQueries({ queryKey: ['user'] }); 
    },
  });

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    updateProfile: updateProfileMutation,
  };
}
