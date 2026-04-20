import { ListFestivalGroupsResponse, GetFestivalSummaryResponse } from "@workspace/api-zod";

const SPREADSHEET_ID = "1W4vJaSM0jlOQcjE-TstUby6v0K1bJeSY3GnSH8BDKhA";
const REGISTRATION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScGPm0_a8bQKofARLyPCa9VK1axy3hc-9APmn5XNkKk8qDgBQ/viewform?usp=header";
const UPDATE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdw6TikJQyRXkQO-qJwGlfsn8-gXT0Qwo8ouQSMW8YkEqk_6A/viewform?usp=header";
const CACHE_TTL_MS = 300_000;

type SheetCell = { v?: unknown; f?: string };
type SheetRow = { c?: Array<SheetCell | null> };
type SheetTable = {
  table?: {
    cols?: Array<{ label?: string }>;
    rows?: SheetRow[];
  };
  status?: string;
  errors?: Array<{ detailed_message?: string; message?: string; reason?: string }>;
};

type RawRecord = Record<string, unknown>;
type FestivalGroup = {
  name: string;
  desc: string;
  location: string;
  hours: string;
  logo: string;
  wait: string;
  comment: string;
  updatedAgo: number | null;
  updatedAt: number | null;
};

let cachedPayload: { fetchedAt: number; groups: FestivalGroup[] } | null = null;

function valueToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseGoogleDate(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;

  const googleDate = value.match(
    /^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/,
  );
  if (googleDate) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] =
      googleDate;
    return new Date(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ).getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function findHeader(headers: string[], patterns: RegExp[]): string | null {
  return headers.find((header) => patterns.some((pattern) => pattern.test(header))) ?? null;
}

function sheetUrl(sheetName: string): string {
  const params = new URLSearchParams({
    tqx: "out:json",
    sheet: sheetName,
  });
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params.toString()}`;
}

async function loadSheet(sheetName: string): Promise<RawRecord[]> {
  const response = await fetch(sheetUrl(sheetName), {
    headers: {
      "User-Agent": "festival-crowd-site/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets returned ${response.status} for ${sheetName}`);
  }

  const body = await response.text();
  const match = body.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
  if (!match) {
    throw new Error(
      "Google Sheets data could not be read. Please set the spreadsheet sharing to anyone with the link can view, or connect Google Sheets access.",
    );
  }

  const parsed = JSON.parse(match[1]) as SheetTable;
  if (parsed.status === "error") {
    const message =
      parsed.errors?.map((error) => error.detailed_message ?? error.message ?? error.reason).join(" / ") ??
      "Unknown Google Sheets error";
    throw new Error(message);
  }

  const labels = parsed.table?.cols?.map((col, index) => valueToString(col.label) || `col${index}`) ?? [];
  return (
    parsed.table?.rows?.map((row) => {
      const record: RawRecord = {};
      labels.forEach((label, index) => {
        const cell = row.c?.[index];
        record[label] = cell?.v ?? cell?.f ?? "";
      });
      return record;
    }) ?? []
  );
}

function buildGroups(groupsRows: RawRecord[], updatesRows: RawRecord[]): FestivalGroup[] {
  const groupHeaders = Object.keys(groupsRows[0] ?? {});
  const updateHeaders = Object.keys(updatesRows[0] ?? {});

  const groupTimestamp = findHeader(groupHeaders, [/タイムスタンプ/, /timestamp/i]);
  const groupName = findHeader(groupHeaders, [/団体名/]);
  const groupDesc = findHeader(groupHeaders, [/説明/]);
  const groupLocation = findHeader(groupHeaders, [/場所/]);
  const groupHours = findHeader(groupHeaders, [/営業時間/]);
  const groupLogo = findHeader(groupHeaders, [/ロゴ/, /サムネイル/]);

  const updateTimestamp = findHeader(updateHeaders, [/タイムスタンプ/, /timestamp/i]);
  const updateName = findHeader(updateHeaders, [/団体名/]);
  const updateWait = findHeader(updateHeaders, [/待ち時間/, /wait/i]);
  const updateComment = findHeader(updateHeaders, [/コメント/, /comment/i]);

  const groups = new Map<string, FestivalGroup & { registeredAt: number | null }>();

  groupsRows.forEach((row) => {
    const name = valueToString(groupName ? row[groupName] : row.col1);
    if (!name) return;

    const registeredAt = parseGoogleDate(groupTimestamp ? row[groupTimestamp] : null);
    const existing = groups.get(name);
    if (existing && registeredAt && existing.registeredAt && registeredAt <= existing.registeredAt) return;

    groups.set(name, {
      name,
      desc: valueToString(groupDesc ? row[groupDesc] : row.col2),
      location: valueToString(groupLocation ? row[groupLocation] : row.col3),
      hours: valueToString(groupHours ? row[groupHours] : row.col4),
      logo: valueToString(groupLogo ? row[groupLogo] : row.col5),
      wait: "未更新",
      comment: "",
      updatedAgo: null,
      updatedAt: null,
      registeredAt,
    });
  });

  const latestUpdates = new Map<string, { wait: string; comment: string; time: number | null }>();

  updatesRows.forEach((row) => {
    const name = valueToString(updateName ? row[updateName] : row.col1);
    if (!name) return;

    const time = parseGoogleDate(updateTimestamp ? row[updateTimestamp] : row.col0);
    const existing = latestUpdates.get(name);
    if (existing && time && existing.time && time <= existing.time) return;

    latestUpdates.set(name, {
      wait: valueToString(updateWait ? row[updateWait] : row.col2) || "未更新",
      comment: valueToString(updateComment ? row[updateComment] : row.col3),
      time,
    });
  });

  const now = Date.now();
  return Array.from(groups.values())
    .map(({ registeredAt, ...group }) => {
      const update = latestUpdates.get(group.name);
      if (!update) return group;

      return {
        ...group,
        wait: update.wait,
        comment: update.comment,
        updatedAt: update.time,
        updatedAgo: update.time ? Math.max(0, Math.floor((now - update.time) / 60_000)) : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export async function getFestivalGroupsPayload() {
  if (cachedPayload && Date.now() - cachedPayload.fetchedAt < CACHE_TTL_MS) {
    return ListFestivalGroupsResponse.parse({
      ...cachedPayload,
      source: {
        spreadsheetId: SPREADSHEET_ID,
        registrationFormUrl: REGISTRATION_FORM_URL,
        updateFormUrl: UPDATE_FORM_URL,
      },
    });
  }

  const [groupsRows, updatesRows] = await Promise.all([
    loadSheet("groups"),
    loadSheet("updates"),
  ]);

  cachedPayload = {
    fetchedAt: Date.now(),
    groups: buildGroups(groupsRows, updatesRows),
  };

  return ListFestivalGroupsResponse.parse({
    ...cachedPayload,
    source: {
      spreadsheetId: SPREADSHEET_ID,
      registrationFormUrl: REGISTRATION_FORM_URL,
      updateFormUrl: UPDATE_FORM_URL,
    },
  });
}

export async function getFestivalSummary() {
  const payload = await getFestivalGroupsPayload();
  const waitMap = new Map<string, number>();
  let newestUpdatedAt: number | null = null;

  payload.groups.forEach((group) => {
    waitMap.set(group.wait, (waitMap.get(group.wait) ?? 0) + 1);
    if (group.updatedAt && (!newestUpdatedAt || group.updatedAt > newestUpdatedAt)) {
      newestUpdatedAt = group.updatedAt;
    }
  });

  const summary = {
    fetchedAt: payload.fetchedAt,
    totalGroups: payload.groups.length,
    updatedGroups: payload.groups.filter((group) => group.updatedAt !== null).length,
    staleGroups: payload.groups.filter(
      (group) => group.updatedAgo === null || group.updatedAgo > 60,
    ).length,
    waitCounts: Array.from(waitMap.entries()).map(([label, count]) => ({ label, count })),
    newestUpdatedAt,
  };

  return GetFestivalSummaryResponse.parse(summary);
}