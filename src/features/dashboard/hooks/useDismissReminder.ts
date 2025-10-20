/**
 * useDismissReminder Hook
 * 
 * Handles dismissing investment reminders by storing dismissal timestamps
 * in user settings.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';

/**
 * Hook to dismiss a reminder
 */
export function useDismissReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const userId = await requireAuth();

      // Get current settings
      const { data: currentSettings, error: fetchError } = await supabase
        .from('settings')
        .select('feature_flags')
        .eq('created_by', userId as any)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Parse existing feature flags (we'll store dismissed reminders here)
      let featureFlags: any = {};
      try {
        featureFlags = currentSettings?.feature_flags || {};
      } catch {
        featureFlags = {};
      }

      // Initialize dismissed_reminders if it doesn't exist
      if (!featureFlags.dismissed_reminders) {
        featureFlags.dismissed_reminders = {};
      }

      // Add current timestamp for this reminder
      featureFlags.dismissed_reminders[reminderId] = new Date().toISOString();

      // Update settings
      const { error: updateError } = await supabase
        .from('settings')
        .upsert({
          created_by: userId as any,
          feature_flags: featureFlags,
        });

      if (updateError) throw updateError;

      return featureFlags.dismissed_reminders;
    },
    onSuccess: () => {
      // Invalidate queries to refresh reminders
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['investment-reminders'] });
    },
  });
}