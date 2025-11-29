// app/index.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useMembershipData,
  type MembershipRecord,
} from "../hooks/useMembershipData";
import { useMysqlForms, type MysqlForm } from "../hooks/useMysqlForms";
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

export default function DashboardScreen() {
  const [email, setEmail] = useState<string | null>(null);

  const {
    data: mysqlForms,
    isLoading: mysqlLoading,
    error: mysqlError,
  } = useMysqlForms();
  const {
    data: membershipData,
    isLoading: membershipLoading,
    error: membershipError,
  } = useMembershipData();

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logoText}>School of Ranch</Text>

      {/* Workshops */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Workshops</Text>
        <Text style={styles.sectionSubtitle}>
          Current registrations for your account.
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {mysqlLoading && (
          <View style={styles.card}>
            <Text>Loading your workshops…</Text>
          </View>
        )}

        {!mysqlLoading && mysqlError && (
          <View style={styles.card}>
            <Text>Failed to load workshops: {mysqlError}</Text>
          </View>
        )}

        {!mysqlLoading && !mysqlError && groupedForms.length === 0 && (
          <View style={styles.card}>
            <Text>No workshops yet.</Text>
          </View>
        )}

        {!mysqlLoading && !mysqlError && groupedForms.length > 0 && (
          <>
            {groupedForms.map((f) => (
              <View key={f.formid} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workshopTitle}>{f.workshop_name}</Text>
                  {labelFromMysql(f) && (
                    <Text style={styles.workshopMeta}>
                      {labelFromMysql(f)} | {f._tickets ?? 1} Tickets
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

            <Pressable
              style={[styles.primaryButton, { alignSelf: "flex-end", marginTop: 8 }]}
              onPress={() =>
                Linking.openURL("https://schoolofranch.org/calendar")
              }
            >
              <Text style={styles.primaryButtonText}>View All</Text>
            </Pressable>
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

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {membershipLoading && <Text>Loading your membership data…</Text>}

          {!membershipLoading && membershipError && (
            <Text>Failed to load membership: {membershipError}</Text>
          )}

          {!membershipLoading &&
            !membershipError &&
            membershipData.length === 0 && (
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
            )}

          {!membershipLoading &&
            !membershipError &&
            membershipData.length > 0 && (
              <MembershipCard membership={membershipData[0]} />
            )}
        </View>
      </View>

      {/* Contact + ID + Logout */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ flex: 1 }}>ID: {email ?? "Loading…"}</Text>
            <Pressable style={styles.dangerButton} onPress={handleLogout}>
              <Text style={styles.dangerButtonText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: "#ffffff",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
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
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    padding: 16,
    marginBottom: 8,
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  workshopMeta: {
    fontSize: 14,
    color: "#4b5563",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: "#b91c1c",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dangerButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  membershipCard: {
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
