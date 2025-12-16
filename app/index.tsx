// app/index.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  type MembershipRecord
} from "../hooks/useMembershipData";
import { type MysqlForm } from "../hooks/useMysqlForms";
import { supabase } from "../lib/supabase";

const MONTH_ABBREVIATIONS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
] as const;

const formatWorkshopDate = (value: string | null) => {
  if (value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = MONTH_ABBREVIATIONS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const labelFromMysql = (f: MysqlForm) => {
  if (f.status === "pre-registered") return "Pre-reg";
  if (f.status === "completed" && f.eventdate) {
    return formatWorkshopDate(f.eventdate);
  }
  if (f.status === "waitlisted") return "Waitlisted";
  return null;
};

// Test Data
const testForms: MysqlForm[] = [
  {
    status: "pre-registered",
    formid: 3,
    eventdate: null,
    prereg: "Off",
    tld: "org",
    workshop_name: "Ranching 101",
    webpage_url: "https://schoolofranch.org/workshops/ranching-101",
    start_time: "08:00:00",
    end_time: "17:00:00",
    memberstatus: null,
    expirationdate: null,
    autorenew: null,
    levelname: null,
    memberid: null,
    _tickets: undefined,
    resolved_url:
      "https://schoolofranch.org/workshops/ranching-101/details?ref=app",
    resolved_reason: undefined,
  },
  {
    status: "completed",
    formid: 5,
    eventdate: "2024-09-15",
    prereg: "Off",
    tld: "org",
    workshop_name: "Advanced Horsemanship",
    webpage_url: "https://schoolofranch.org/workshops/advanced-horsemanship",
    start_time: "09:00:00",
    end_time: "16:00:00",
    memberstatus: null,
    expirationdate: null,
    autorenew: null,
    levelname: null,
    memberid: null,
    _tickets: undefined,
    resolved_url:
      "https://schoolofranch.org/workshops/advanced-horsemanship/details?ref=app",
    resolved_reason: undefined,
  },
];

const testMembershipData: MembershipRecord[] = [
  {
    memberid: 12345,
    memberstatus: "Active",
    expirationdate: "2025-06-30",
    autorenew: 1,
    levelname: "Gold",
  },
];

export default function DashboardScreen() {
  const [email, setEmail] = useState<string | null>(null);

  // const {
  //   data: mysqlForms,
  //   isLoading: mysqlLoading,
  //   error: mysqlError,
  // } = useMysqlForms();
  // const {
  //   data: membershipData,
  //   isLoading: membershipLoading,
  //   error: membershipError,
  // } = useMembershipData();

  const mysqlForms = testForms; // For testing without data
  const mysqlLoading = false;
  const mysqlError = null;
  const membershipData = testMembershipData; // For testing without data
  const membershipLoading = false;
  const membershipError = null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const groupedForms: MysqlForm[] = useMemo(() => {
    const acc: Record<number, MysqlForm> = {};
    for (const item of mysqlForms) {
      const existing = acc[item.formid];
      if (!existing) {
        acc[item.formid] = { ...item, _tickets: 1 };
      } else {
        acc[item.formid]._tickets = (existing._tickets ?? 0) + 1;
      }
    }
    return Object.values(acc);
  }, [mysqlForms]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // _layout.tsx will see session=null and push to /auth
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* <Text style={styles.logoText}>School of Ranch</Text> */}

        <Image
          source={require("../assets/images/logo-full.png")}
          style={{ width: 332, height: 100, alignSelf: "center" }}
        />

        {/* Workshops */}
        <View style={[{ display: "flex", flexDirection: "row", justifyContent: "space-between" }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Workshops</Text>
            <Text style={styles.sectionSubtitle}>
              Current registrations for your account.
            </Text>
          </View>

          <Pressable
            style={[styles.primaryButton, { alignSelf: "flex-end", marginBottom: 16 }]}
            onPress={() =>
              Linking.openURL("https://schoolofranch.org/calendar")
            }
          >
            <Text style={styles.primaryButtonText}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {mysqlLoading && (
            <View style={styles.subCard}>
              <Text>Loading your workshops…</Text>
            </View>
          )}

          {!mysqlLoading && mysqlError && (
            <View style={styles.subCard}>
              <Text>Failed to load workshops: {mysqlError}</Text>
            </View>
          )}

          {!mysqlLoading && !mysqlError && groupedForms.length === 0 && (
            <View style={styles.subCard}>
              <Text>No workshops yet.</Text>
            </View>
          )}

          {!mysqlLoading && !mysqlError && groupedForms.length > 0 && (
            <>
              {groupedForms.map((f) => (
                <View key={f.formid} style={styles.subCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workshopTitle}>{f.workshop_name}</Text>
                    {labelFromMysql(f) && (
                      <Text style={styles.workshopMeta}>
                        {labelFromMysql(f)} | {f._tickets ?? 1} Ticket(s)
                      </Text>
                    )}
                  </View>

                  {f.resolved_url ? (
                    <Pressable
                      style={styles.primaryButton}
                      onPress={() => Linking.openURL(f.resolved_url!)}
                    >
                      <Text style={styles.primaryButtonText}>Details</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </>
          )}
        </View>

        {/* Membership */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membership</Text>
          <Text style={styles.sectionSubtitle}>
            Memberships earn discounts and benefits.
          </Text>
        </View>

        <View style={styles.card}>
          {membershipLoading && (
            <View style={styles.subCard}>
              <Text>Loading your membership data…</Text>
            </View>
          )}

          {!membershipLoading && membershipError && (
            <View style={styles.subCard}>
              <Text>Failed to load membership: {membershipError}</Text>
            </View>
          )}

          {!membershipLoading &&
            !membershipError &&
            membershipData.length === 0 && (
              <View style={styles.subCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ flex: 1 }}>
                    Join and earn up to 20% off all workshops for a year!
                  </Text>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() =>
                      Linking.openURL("https://schoolofranch.org/join")
                    }
                  >
                    <Text style={styles.primaryButtonText}>Join</Text>
                  </Pressable>
                </View>
              </View>
            )}

          {!membershipLoading &&
            !membershipError &&
            membershipData.length > 0 && (
              <MembershipCard membership={membershipData[0]} />
            )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>School of Ranch App</Text>
          <Text style={styles.sectionSubtitle}>
            Tricks, tips, and more.
          </Text>
        </View>

        {/* Contact + ID + Logout */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={[styles.subCard, { flexDirection: "row", alignItems: "center" }]}>
              <Text style={{ flex: 1 }}>Contact School of Ranch</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => Linking.openURL("mailto:info@schoolofranch.org")}
              >
                <Text style={styles.primaryButtonText}>Go</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.subCard, { flexDirection: "row", alignItems: "center" }]}>
              <Text style={{ flex: 1 }}>ID: {email ?? "Loading…"}</Text>
              <Pressable style={styles.primaryButton} onPress={handleLogout}>
                <Text style={styles.primaryButtonText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MembershipCard({ membership }: { membership: MembershipRecord }) {
  return (
    <View style={styles.membershipCard}>
      <Row label="ID" value={membership.memberid ?? ""} />
      <Row label="Status" value={membership.memberstatus ?? ""} />
      <Row
        label="Expires"
        value={formatWorkshopDate(membership.expirationdate) ?? ""}
      />
      <Row
        label="Auto Renew"
        value={Number(membership.autorenew) ? "Yes" : "No"}
      />
      <Row label="Level" value={membership.levelname ?? ""} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.memberRow}>
      <Text style={styles.memberLabel}>{label}</Text>
      <Text style={styles.memberValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 32,
    // backgroundColor: "#ffffff",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#4b5563",
  },

  card: {
    backgroundColor: "#f3f4f6", // Tailwind gray-100
    padding: 8,
    borderRadius: 16, // 1rem
    marginBottom: 16,
    display: "flex",
    gap: 8,
  },

  subCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 12,
  },

  cardContainer: {
    marginBottom: 16,
  },

  workshopContent: {
    flex: 1,
    marginRight: 12,
  },

  workshopTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },

  workshopMeta: {
    fontSize: 16,
    fontWeight: "600",
    color: "#687888",
  },

  primaryButton: {
    backgroundColor: "#2b7fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12, // pill-like
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  membershipCard: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  memberLabel: {
    fontSize: 13,
    color: "#4b5563",
  },
  memberValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
});

