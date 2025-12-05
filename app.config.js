import 'dotenv/config';

export default {
  expo: {
    name: 'School of Ranch',
    slug: 'school-of-ranch',

    android: {
      package: 'com.sorapp.android',
    },

    ios: {
      bundleIdentifier: 'com.sorapp.ios',
    },

    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: '52b3b02a-aa7d-4899-a8d4-4c6e1b58b366',
      },
    },
  },
};
