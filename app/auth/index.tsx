import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Mode = "login-password" | "signup" | "login-otp";
type Step = "form" | "verify";

export default function AuthScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login-password");
  const [step, setStep] = useState<Step>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpType, setOtpType] = useState<"email" | "signup">("email");

  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const resetForMode = (nextMode: Mode) => {
    setMode(nextMode);
    setStep("form");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setOtpType("email");
  };

  const showError = (message: string) => {
    Alert.alert("Error", message);
  };

  const handlePasswordLogin = async () => {
    if (!validateEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      showError("Please enter your password.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        showError(
          "Please verify your email first. Check your inbox for a confirmation email or code.",
        );
      } else {
        showError(error.message);
      }
      return;
    }

    console.log("Authenticated session:", data.session);
    router.replace("/");
  };

  const handleSignup = async () => {
    if (!validateEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      showError(error.message);
      return;
    }

    if (data.session) {
      router.replace("/");
      return;
    }

    setStep("verify");
    setOtpType("signup");
  };

  const sendLoginCode = async () => {
    if (!validateEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error) {
      showError(
        "We couldn’t send a login code for this email. Check that you typed it correctly or create an account.",
      );
      return;
    }

    setStep("verify");
    setOtpType("email");
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      showError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: otpType,
    });
    setLoading(false);

    if (error) {
      showError(error.message);
      return;
    }

    console.log("Verified via OTP, session:", data.session);
    router.replace("/");
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      showError("Enter your email first to reset your password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://YOUR_WEB_APP_DOMAIN/auth/reset",
    });
    setLoading(false);

    if (error) {
      showError(error.message);
      return;
    }

    Alert.alert(
      "Password reset",
      "If an account exists for that email, you'll receive a password reset link shortly.",
    );
  };

  const renderFormStep = () => {
    if (step !== "form") return null;

    return (
      <>
        <View style={styles.modeRow}>
          <Pressable
            style={[
              styles.modeButton,
              mode === "login-password" && styles.modeButtonActive,
            ]}
            onPress={() => resetForMode("login-password")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "login-password" && styles.modeTextActive,
              ]}
            >
              Log in
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              mode === "signup" && styles.modeButtonActive,
            ]}
            onPress={() => resetForMode("signup")}
          >
            <Text
              style={[
                styles.modeText,
                mode === "signup" && styles.modeTextActive,
              ]}
            >
              Create account
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>
          {mode === "signup" ? "Create your account" : "Email address"}
        </Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />

        {mode === "login-password" && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              style={styles.primaryButton}
              onPress={handlePasswordLogin}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Signing in..." : "Log in"}
              </Text>
            </Pressable>

            <View style={styles.inlineLinks}>
              <Pressable onPress={() => resetForMode("login-otp")}>
                <Text style={styles.linkText}>Use a login code instead</Text>
              </Pressable>
              <Pressable onPress={handleResetPassword}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            </View>
          </>
        )}

        {mode === "signup" && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Creating account..." : "Create account"}
              </Text>
            </Pressable>
          </>
        )}

        {mode === "login-otp" && (
          <>
            <Pressable
              style={styles.primaryButton}
              onPress={sendLoginCode}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Sending code..." : "Send login code"}
              </Text>
            </Pressable>

            <Pressable onPress={() => resetForMode("login-password")}>
              <Text style={styles.linkTextCentered}>
                Back to password login
              </Text>
            </Pressable>
          </>
        )}
      </>
    );
  };

  const renderVerifyStep = () => {
    if (step !== "verify") return null;

    return (
      <>
        <Text style={styles.infoText}>
          Enter the code sent to{" "}
          <Text style={styles.infoTextStrong}>{email}</Text>
        </Text>

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={verifyCode}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Verifying..." : "Verify code"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setStep("form");
            setCode("");
          }}
        >
          <Text style={styles.linkTextCentered}>Back</Text>
        </Pressable>
      </>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>School of Ranch</Text>
        {renderFormStep()}
        {renderVerifyStep()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffffff",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#f1f1f1ff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
  },
  modeButtonActive: {
    backgroundColor: "#d1d5db",
  },
  modeText: {
    fontSize: 13,
    color: "#4b5563",
  },
  modeTextActive: {
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 15,
    backgroundColor: "white",
  },
  codeInput: {
    letterSpacing: 4,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#2b7fff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  inlineLinks: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkText: {
    fontSize: 12,
    color: "#2563eb",
    textDecorationLine: "underline",
  },
  linkTextCentered: {
    fontSize: 12,
    color: "#2563eb",
    textDecorationLine: "underline",
    textAlign: "center",
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoTextStrong: {
    fontWeight: "600",
  },
});
