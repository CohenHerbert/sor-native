import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function useAuthRouting(session: Session | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) return;

    const inAuth = segments[0] === "auth";

    if (!session && !inAuth) {
      router.replace("/auth");
    } else if (session && inAuth) {
      router.replace("/");
    }
  }, [session, segments, router]);
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      style={{ paddingHorizontal: 12 }}
    >
      <Text style={{ color: "#ffffff" }}>Back</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useAuthRouting(session);

  if (session === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ecececff",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffffff" },
          headerTintColor: "#000000ff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#ffffffff" },
        }}
      >
        {/* No back button on home */}
        <Stack.Screen
          name="index"
          options={{
            title: "School of Ranch",
            headerLeft: () => null,
            headerShown: false,
          }}
        />

        {/* Example: auth screens with no back button */}
        <Stack.Screen
          name="auth/index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
