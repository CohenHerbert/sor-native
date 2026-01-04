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

    version: '1.0.12', // TODO: Update this when releasing a new version

    android: {
      package: 'com.sorapp.android',

      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon.png',
        backgroundColor: '#ffffff',
      },
      versionCode: 12, // TODO: Update this when releasing a new version
    },

    ios: {
      bundleIdentifier: 'com.sorapp.ios',
      icon: './assets/images/ios-icon.png',
      buildNumber: '12', // TODO: Update this when releasing a new version & must be a string
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
