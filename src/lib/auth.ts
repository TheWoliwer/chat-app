import { supabase } from './supabase';

export async function signUp(email: string, password: string, username: string, fullName: string) {
  try {
    // Önce kullanıcıyı kaydet
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Sonra profil bilgilerini kaydet
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          full_name: fullName,
        });

      if (profileError) throw profileError;
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Kayıt olurken hata:', error);
    return { success: false, error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Giriş yaparken hata:', error);
    return { success: false, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Çıkış yaparken hata:', error);
    return { success: false, error };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session) {
      return { user: null };
    }
    
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) throw profileError;
    
    return { user: { ...session.user, profile: data } };
  } catch (error) {
    console.error('Kullanıcı bilgisi alınırken hata:', error);
    return { user: null, error };
  }
}