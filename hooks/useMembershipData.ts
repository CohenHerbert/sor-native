import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { MysqlForm } from "./useMysqlForms";

export type MembershipRecord = Pick<
  MysqlForm,
  "memberstatus" | "expirationdate" | "autorenew" | "levelname" | "memberid"
>;

function safeParse(body: string): any {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function useMembershipData() {
  const [data, setData] = useState<MembershipRecord[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      //
      // 1. Get session BEFORE the try/catch — prevents "not authenticated" noise
      //
      const { data: sessionData, error: sErr } =
        await supabase.auth.getSession();

      // Session retrieval error
      if (sErr) {
        console.error("[useMembershipData] session error:", sErr);
        setError(sErr.message);
        setLoading(false);
        return;
      }

      const token = sessionData?.session?.access_token;

      //
      // 2. If user not logged in → return empty data, do NOT error
      //
      if (!token) {
        setData([]);
        setLoading(false);
        return;
      }

      //
      // 3. Token exists → now perform network request inside try/catch
      //
      try {
        const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (!base) throw new Error("EXPO_PUBLIC_SUPABASE_URL missing");

        const endpoint = `${base}/functions/v1/mysql`;

        const res = await fetch(endpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        // const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${raw}`);
        }

        const json = safeParse(raw);
        if (!json) throw new Error("Response was not valid JSON");

        const extractArray = (j: any) => {
          if (Array.isArray(j)) return j;
          if (Array.isArray(j?.data)) return j.data;
          throw new Error("JSON shape unexpected");
        };

        const isMembershipRow = (item: any) => {
          const hasMemberId = item.memberid != null;
          const noWorkshopData =
            item.workshop_name == null &&
            item.formid == null &&
            item.eventdate == null &&
            item.webpage_url == null &&
            item.start_time == null &&
            item.end_time == null;
          return hasMemberId && noWorkshopData;
        };

        const toMembershipRecord = (item: any): MembershipRecord => ({
          memberstatus: item.memberstatus ?? null,
          expirationdate: item.expirationdate ?? null,
          autorenew: item.autorenew ?? null,
          levelname: item.levelname ?? null,
          memberid: item.memberid ?? null,
        });

        const arr = extractArray(json);
        const membershipRows = arr
          .filter(isMembershipRow)
          .map(toMembershipRecord);

        setData(membershipRows);
      } catch (e: any) {
        console.error("[useMembershipData] error:", e);
        setError(e?.message ?? "Request failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, isLoading, error };
}
