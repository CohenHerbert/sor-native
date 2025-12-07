import 'dotenv/config';

export default {
  expo: {
    name: 'School of Ranch',
    slug: 'school-of-ranch',

    scheme: 'sor',

    icon: './assets/images/ios-icon.png',

    splash: {
      image: './assets/images/ios-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    version: '1.0.1',

    android: {
      package: 'com.sorapp.android',
      icon: './assets/images/android-icon.png',
      versionCode: 5,
    },

    ios: {
      bundleIdentifier: 'com.sorapp.ios',
      icon: './assets/images/ios-icon.png',
      buildNumber: '4',
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
