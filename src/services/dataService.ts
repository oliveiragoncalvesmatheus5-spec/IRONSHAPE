import { WorkoutLog, ProgressLog, Post, NutritionLog } from '../types';
import { supabase } from '../lib/supabaseClient';
import { withTimeout } from '../lib/utils';

export const dataService = {
  getWorkoutLogs: async (userUid: string): Promise<WorkoutLog[]> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('userUid', userUid)
        .order('completedAt', { ascending: false });
      
      if (error) throw error;
      return data as WorkoutLog[];
    }, 15000, 2);
  },

  addWorkoutLog: async (log: Omit<WorkoutLog, 'id'>): Promise<WorkoutLog> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert([log])
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkoutLog;
    }, 15000, 2);
  },

  getProgressLogs: async (userUid: string): Promise<ProgressLog[]> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('userUid', userUid)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as ProgressLog[];
    }, 15000, 2);
  },

  addProgressLog: async (log: Omit<ProgressLog, 'id'>): Promise<ProgressLog> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('progress_logs')
        .insert([log])
        .select()
        .single();
      
      if (error) throw error;
      return data as ProgressLog;
    }, 15000, 2);
  },

  getPosts: async (): Promise<Post[]> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return data as Post[];
    }, 15000, 2);
  },

  addPost: async (post: Omit<Post, 'id'>): Promise<Post> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('posts')
        .insert([post])
        .select()
        .single();
      
      if (error) throw error;
      return data as Post;
    }, 15000, 2);
  },

  likePost: async (postId: string, userUid: string) => {
    return withTimeout(async () => {
      // Get current likes
      const { data: post, error: getError } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId)
        .single();
      
      if (getError) throw getError;

      let newLikes = [...(post.likes || [])];
      if (newLikes.includes(userUid)) {
        newLikes = newLikes.filter(uid => uid !== userUid);
      } else {
        newLikes.push(userUid);
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: newLikes })
        .eq('id', postId);
      
      if (updateError) throw updateError;
    }, 15000, 2);
  },
  
  getNutritionLog: async (userUid: string, date: string): Promise<NutritionLog | null> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userUid)
        .eq('date', date)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as NutritionLog | null;
    }, 15000, 2);
  },

  updateNutritionLog: async (log: Omit<NutritionLog, 'id'>): Promise<NutritionLog> => {
    return withTimeout(async () => {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .upsert([{ ...log }], { onConflict: 'user_id,date' })
        .select()
        .single();
      
      if (error) throw error;
      return data as NutritionLog;
    }, 15000, 2);
  }
};
