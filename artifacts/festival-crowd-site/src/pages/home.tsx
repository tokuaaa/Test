import { useListFestivalGroups, getListFestivalGroupsQueryKey, useGetFestivalSummary, getGetFestivalSummaryQueryKey } from "@workspace/api-client-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, MapPin, Search, Filter, AlertCircle, Info, RefreshCw, Calendar, Sparkles, Star, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CIRCLED_NUMS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿";
const CIRCLED_ARRAY = Array.from(CIRCLED_NUMS);

function getAnonymousLabel(idx: number): string {
  if (idx < 0) return "団体";
  if (idx < CIRCLED_ARRAY.length) return `団体${CIRCLED_ARRAY[idx]}`;
  return `団体${idx + 1}`;
}


type MapPoint = {
  room: string;
  display: string;
  floor: string;
  x: number;
  y: number;
  aliases: string[];
};

type SelectedGroupInfo = {
  name: string;
  wait: string;
  location: string;
  desc: string;
  room: string;
};

const mapPoints: MapPoint[] = [
  { room: "中1A", display: "中1学年参加", floor: "中学棟3階", x: 11, y: 70, aliases: ["中1A", "中１A", "中1学年参加"] },
  { room: "中1B", display: "中1学年参加", floor: "中学棟3階", x: 23, y: 70, aliases: ["中1B", "中１B", "中1学年参加"] },
  { room: "中1C", display: "歴史研究部", floor: "中学棟3階", x: 35, y: 70, aliases: ["中1C", "中１C", "歴史研究部"] },
  { room: "中1D", display: "歴史研究部", floor: "中学棟3階", x: 60, y: 25, aliases: ["中1D", "中１D", "歴史研究部"] },
  { room: "中1E", display: "歴史研究部", floor: "中学棟3階", x: 73, y: 25, aliases: ["中1E", "中１E", "歴史研究部"] },
  { room: "中1F", display: "LASER TAG", floor: "中学棟3階", x: 86, y: 25, aliases: ["中1F", "中１F", "LASER TAG"] },
  { room: "中2A", display: "レトロ喫茶まさる", floor: "中学棟4階", x: 11, y: 70, aliases: ["中2A", "中２A", "レトロ喫茶", "まさる"] },
  { room: "中2B", display: "レトロ喫茶まさる", floor: "中学棟4階", x: 23, y: 70, aliases: ["中2B", "中２B", "レトロ喫茶", "まさる"] },
  { room: "中2C", display: "夏展", floor: "中学棟4階", x: 35, y: 70, aliases: ["中2C", "中２C", "夏展"] },
  { room: "中2D", display: "中2学年参加", floor: "中学棟4階", x: 60, y: 25, aliases: ["中2D", "中２D", "中2学年参加"] },
  { room: "中2E", display: "神兵衛", floor: "中学棟4階", x: 73, y: 25, aliases: ["中2E", "中２E", "神兵衛"] },
  { room: "中2F", display: "神兵衛", floor: "中学棟4階", x: 86, y: 25, aliases: ["中2F", "中２F", "神兵衛"] },
  { room: "中3A", display: "浅野小学校", floor: "中学棟5階", x: 11, y: 70, aliases: ["中3A", "中３A", "浅野小学校"] },
  { room: "中3B", display: "浅野小学校", floor: "中学棟5階", x: 23, y: 70, aliases: ["中3B", "中３B", "浅野小学校"] },
  { room: "中3C", display: "ASET(特撮)", floor: "中学棟5階", x: 35, y: 70, aliases: ["中3C", "中３C", "ASET", "特撮"] },
  { room: "中3D", display: "折り紙研究会", floor: "中学棟5階", x: 60, y: 25, aliases: ["中3D", "中３D", "折り紙研究会"] },
  { room: "中3E", display: "書道部", floor: "中学棟5階", x: 73, y: 25, aliases: ["中3E", "中３E", "書道部"] },
  { room: "中3F", display: "書道部", floor: "中学棟5階", x: 86, y: 25, aliases: ["中3F", "中３F", "書道部"] },
  { room: "高一A", display: "生徒会", floor: "高校棟3階", x: 11, y: 70, aliases: ["高一A", "高1A", "生徒会"] },
  { room: "高一B", display: "数学同好会", floor: "高校棟3階", x: 23, y: 70, aliases: ["高一B", "高1B", "数学同好会"] },
  { room: "高一C", display: "化学部", floor: "高校棟3階", x: 35, y: 70, aliases: ["高一C", "高1C", "化学部"] },
  { room: "高一D", display: "お化け屋敷", floor: "高校棟3階", x: 60, y: 25, aliases: ["高一D", "高1D", "お化け屋敷"] },
  { room: "高一E", display: "お化け屋敷", floor: "高校棟3階", x: 73, y: 25, aliases: ["高一E", "高1E", "お化け屋敷"] },
  { room: "高一F", display: "お化け屋敷", floor: "高校棟3階", x: 86, y: 25, aliases: ["高一F", "高1F", "お化け屋敷"] },
  { room: "選択教室1", display: "化学部", floor: "高校棟3階", x: 47, y: 70, aliases: ["選択教室1", "選択教室１", "化学部"] },
  { room: "選択教室2", display: "化学部", floor: "高校棟3階", x: 47, y: 25, aliases: ["選択教室2", "選択教室２", "化学部"] },
  { room: "高二A", display: "地学部", floor: "高校棟4階", x: 11, y: 70, aliases: ["高二A", "高2A", "地学部"] },
  { room: "高二B", display: "地学部", floor: "高校棟4階", x: 23, y: 70, aliases: ["高二B", "高2B", "地学部"] },
  { room: "高二C", display: "アサノ大全", floor: "高校棟4階", x: 35, y: 70, aliases: ["高二C", "高2C", "アサノ大全"] },
  { room: "高二D", display: "カードゲーム同好会", floor: "高校棟4階", x: 60, y: 25, aliases: ["高二D", "高2D", "カードゲーム同好会"] },
  { room: "高二E", display: "BARミヤン", floor: "高校棟4階", x: 73, y: 25, aliases: ["高二E", "高2E", "BARミヤン"] },
  { room: "高二F", display: "BARミヤン", floor: "高校棟4階", x: 86, y: 25, aliases: ["高二F", "高2F", "BARミヤン"] },
  { room: "選択教室3", display: "地学部プラネタリウム", floor: "高校棟4階", x: 47, y: 70, aliases: ["選択教室3", "選択教室３", "プラネタリウム", "地学部"] },
  { room: "選択教室4", display: "棋道部", floor: "高校棟4階", x: 47, y: 25, aliases: ["選択教室4", "選択教室４", "棋道部"] },
  { room: "高三A", display: "歴史研究部", floor: "高校棟5階", x: 11, y: 70, aliases: ["高三A", "高3A", "歴史研究部"] },
  { room: "高三B", display: "歴史研究部", floor: "高校棟5階", x: 23, y: 70, aliases: ["高三B", "高3B", "歴史研究部"] },
  { room: "高三C", display: "鉄道研究部", floor: "高校棟5階", x: 35, y: 70, aliases: ["高三C", "高3C", "鉄道研究部"] },
  { room: "高三D", display: "鉄道研究部", floor: "高校棟5階", x: 60, y: 25, aliases: ["高三D", "高3D", "鉄道研究部"] },
  { room: "高三E", display: "りすのおうち", floor: "高校棟5階", x: 73, y: 25, aliases: ["高三E", "高3E", "りすのおうち"] },
  { room: "高三F", display: "りすのおうち", floor: "高校棟5階", x: 86, y: 25, aliases: ["高三F", "高3F", "りすのおうち"] },
  { room: "高三G", display: "登山部", floor: "高校棟5階", x: 47, y: 25, aliases: ["高三G", "高3G", "登山部"] },
  { room: "高三H", display: "鉄道研究部", floor: "高校棟5階", x: 47, y: 70, aliases: ["高三H", "高3H", "鉄道研究部"] },
  { room: "社会科教室", display: "物理部展", floor: "その他", x: 14, y: 20, aliases: ["社会科教室", "物理部展", "物理部"] },
  { room: "ICT教室", display: "クイズ研究部", floor: "その他", x: 35, y: 48, aliases: ["ICT教室", "クイズ研究部"] },
  { room: "中学会議室", display: "PTA厚生部バザー", floor: "その他", x: 63, y: 72, aliases: ["中学会議室", "PTA厚生部バザー", "PTA"] },
  { room: "演習教室1", display: "賛助会", floor: "その他", x: 82, y: 22, aliases: ["演習教室1", "演習教室１", "賛助会"] },
  { room: "演習教室2", display: "同窓会", floor: "その他", x: 68, y: 22, aliases: ["演習教室2", "演習教室２", "同窓会"] },
];

const floors = [
  "すべて",
  "中学棟3階",
  "中学棟4階",
  "中学棟5階",
  "高校棟3階",
  "高校棟4階",
  "高校棟5階",
  "その他",
];


type ScheduleVenue = "中学棟" | "高校棟" | "校庭" | "打越アリーナ" | "その他";

type ScheduleEvent = {
  id: string;
  title: string;
  venue: ScheduleVenue;
  startMinutes: number;
  endMinutes: number;
};

const scheduleVenues: ScheduleVenue[] = ["中学棟", "高校棟", "校庭", "打越アリーナ", "その他"];

const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 17;

const scheduleSlots = Array.from(
  { length: (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 2 },
  (_, i) => {
    const minutes = SCHEDULE_START_HOUR * 60 + i * 30;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return {
      label: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      startMinutes: i * 30,
    };
  },
);

const scheduleEvents: ScheduleEvent[] = [
  {
    id: "quiz",
    title: "クイズ大会",
    venue: "打越アリーナ",
    startMinutes: (10 - SCHEDULE_START_HOUR) * 60,
    endMinutes: (15 - SCHEDULE_START_HOUR) * 60,
  },
];

const waitColorMap: Record<string, { dot: string; ring: string; label: string }> = {
  "待ちなし": { dot: "bg-emerald-500", ring: "ring-emerald-400", label: "空き" },
  "空きあり": { dot: "bg-emerald-500", ring: "ring-emerald-400", label: "空き" },
  "少し混雑": { dot: "bg-amber-500", ring: "ring-amber-400", label: "やや" },
  "10-20分待ち": { dot: "bg-amber-500", ring: "ring-amber-400", label: "10-20" },
  "混雑": { dot: "bg-rose-600", ring: "ring-rose-500", label: "混雑" },
  "30分以上待ち": { dot: "bg-rose-600", ring: "ring-rose-500", label: "30+" },
  "整理券配布終了": { dot: "bg-rose-600", ring: "ring-rose-500", label: "終" },
  "受付終了": { dot: "bg-slate-400", ring: "ring-slate-300", label: "終" },
  "準備中": { dot: "bg-slate-400", ring: "ring-slate-300", label: "準" },
  "休止中": { dot: "bg-slate-400", ring: "ring-slate-300", label: "休" },
};

function getWaitVisual(wait?: string) {
  if (!wait) return { dot: "bg-slate-300", ring: "ring-slate-200", label: "?" };
  return waitColorMap[wait] ?? { dot: "bg-primary", ring: "ring-primary/40", label: "?" };
}

function isEmptyWait(wait?: string) {
  return wait === "待ちなし" || wait === "空きあり";
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s/g, "").replace(/[１-９Ａ-Ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
}

function findMapPoint(group: { name: string; location: string }) {
  const target = normalizeText(`${group.name} ${group.location}`);
  return mapPoints.find((point) =>
    [point.room, point.display, point.floor, ...point.aliases].some((alias) => {
      const normalized = normalizeText(alias);
      return normalized.length > 1 && target.includes(normalized);
    }),
  );
}

export default function Home() {
  const { data: groupsPayload, isLoading: isLoadingGroups, refetch: refetchGroups, isFetching: isFetchingGroups } = useListFestivalGroups({
    query: { queryKey: getListFestivalGroupsQueryKey() }
  });

  const { data: summary, isLoading: isLoadingSummary } = useGetFestivalSummary({
    query: { queryKey: getGetFestivalSummaryQueryKey() }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [waitFilter, setWaitFilter] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState("すべて");
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<SelectedGroupInfo | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("festival-favorites");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  });

  // --- coordinate edit mode ---
  const [editMode, setEditMode] = useState(false);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem("floormap-positions") ?? "{}");
    } catch {
      return {};
    }
  });
  const [draggingRoom, setDraggingRoom] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem("floormap-positions", JSON.stringify(customPositions));
    } catch {
      // ignore
    }
  }, [customPositions]);

  useEffect(() => {
    try {
      window.localStorage.setItem("festival-favorites", JSON.stringify(favorites));
    } catch {
      // ignore quota / private mode errors
    }
  }, [favorites]);

  const favoriteKey = useCallback((g: { name: string; location: string }) => `${g.name}__${g.location}`, []);

  const toggleFavorite = useCallback(
    (g: { name: string; location: string }) => {
      const key = favoriteKey(g);
      setFavorites((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    },
    [favoriteKey],
  );

  const anonymousIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!groupsPayload?.groups) return map;
    [...groupsPayload.groups]
      .sort((a, b) =>
        a.location.localeCompare(b.location, "ja") || a.name.localeCompare(b.name, "ja"),
      )
      .forEach((g, idx) => {
        map.set(`${g.name}__${g.location}`, idx);
      });
    return map;
  }, [groupsPayload?.groups]);

  const displayName = useCallback(
    (g: { name: string; location: string } | undefined | null): string => {
      if (!g) return "";
      const idx = anonymousIndexMap.get(`${g.name}__${g.location}`);
      if (idx === undefined) return getAnonymousLabel(0).replace(CIRCLED_ARRAY[0], "?");
      return getAnonymousLabel(idx);
    },
    [anonymousIndexMap],
  );


  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);


  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const floor = params.get("floor");
    if (floor && floors.includes(floor)) {
      setSelectedFloor(floor);
    }
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groupsPayload?.groups) return [];
    
    let filtered = groupsPayload.groups;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qNorm = q.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
      filtered = filtered.filter(g => {
        const anon = displayName(g).toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.desc.toLowerCase().includes(q) ||
          g.location.toLowerCase().includes(q) ||
          anon.includes(q) ||
          anon.includes(qNorm)
        );
      });
    }
    
    if (waitFilter !== "all") {
      filtered = filtered.filter(g => g.wait === waitFilter);
    }
    
    if (selectedFloor !== "すべて") {
      const selectedFloorNorm = normalizeText(selectedFloor);
      filtered = filtered.filter(g => {
        const pt = findMapPoint(g);
        if (pt) return pt.floor === selectedFloor;
        // mapPoint が見つからない場合は location 文字列で直接照合
        return normalizeText(g.location).includes(selectedFloorNorm);
      });
    }

    return filtered;
  }, [groupsPayload?.groups, searchQuery, waitFilter, selectedFloor]);

  const favoriteGroups = useMemo(() => {
    if (!groupsPayload?.groups || favorites.length === 0) return [];
    const set = new Set(favorites);
    return groupsPayload.groups.filter((g) => set.has(`${g.name}__${g.location}`));
  }, [groupsPayload?.groups, favorites]);

  const recommendedGroups = useMemo(() => {
    if (!groupsPayload?.groups) return [];
    const waitPriority: Record<string, number> = {
      "待ちなし": 1, "空きあり": 1,
      "少し混雑": 2, "10-20分待ち": 2,
      "混雑": 5, "30分以上待ち": 5, "整理券配布終了": 9,
      "受付終了": 99, "準備中": 99, "休止中": 99,
    };
    const ranked = groupsPayload.groups
      .filter((g) => g.wait && waitPriority[g.wait] !== undefined && waitPriority[g.wait] < 5)
      .sort((a, b) => (waitPriority[a.wait] ?? 99) - (waitPriority[b.wait] ?? 99));
    return ranked.slice(0, 6);
  }, [groupsPayload?.groups]);

  const getWaitBadgeColor = (wait: string) => {
    switch (wait) {
      case "待ちなし":
      case "空きあり":
        return "bg-green-500 hover:bg-green-600 text-white border-transparent";
      case "少し混雑":
      case "10-20分待ち":
        return "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent";
      case "混雑":
      case "30分以上待ち":
      case "整理券配布終了":
        return "bg-red-500 hover:bg-red-600 text-white border-transparent";
      case "受付終了":
      case "準備中":
      case "休止中":
        return "bg-gray-500 hover:bg-gray-600 text-white border-transparent";
      default:
        return "bg-primary hover:bg-primary/90 text-white border-transparent";
    }
  };

  const visibleMapGroups = useMemo(() => {
    return filteredGroups
      .map((group) => ({ group, point: findMapPoint(group) }))
      .filter((item): item is { group: typeof filteredGroups[number]; point: MapPoint } => Boolean(item.point))
      .filter((item) => selectedFloor === "すべて" || item.point.floor === selectedFloor);
  }, [filteredGroups, selectedFloor]);

  const visibleReferencePoints = useMemo(() => {
    return mapPoints.filter((point) => selectedFloor === "すべて" || point.floor === selectedFloor);
  }, [selectedFloor]);

  const allMappedGroups = useMemo(() => {
    if (!groupsPayload?.groups) return [] as { group: { name: string; wait?: string; location: string; desc: string }; point: MapPoint }[];
    return groupsPayload.groups
      .map((group) => ({ group, point: findMapPoint(group) }))
      .filter((item): item is { group: typeof groupsPayload.groups[number]; point: MapPoint } => Boolean(item.point));
  }, [groupsPayload?.groups]);

  const emptyOnSelectedFloor = useMemo(() => {
    if (selectedFloor === "すべて") return [];
    return allMappedGroups.filter((item) => item.point.floor === selectedFloor && isEmptyWait(item.group.wait));
  }, [allMappedGroups, selectedFloor]);

  const nowMinutes = (now.getHours() - SCHEDULE_START_HOUR) * 60 + now.getMinutes();

  const activeEvents = useMemo(() => {
    return scheduleEvents.filter((ev) => nowMinutes >= ev.startMinutes && nowMinutes < ev.endMinutes);
  }, [nowMinutes]);

  const handleRefresh = () => {
    refetchGroups();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[radial-gradient(circle_at_center,_hsl(40_90%_60%)_0%,_hsl(354_82%_56%)_45%,_hsl(220_50%_15%)_100%)]">
          <div className="text-center text-white animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/30 bg-white/15 shadow-2xl backdrop-blur-md">
              <span className="text-4xl font-black tracking-tight">47th</span>
            </div>
            <p className="text-sm font-semibold tracking-[0.35em] text-white/80">SCHOOL FESTIVAL</p>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              祭
            </div>
            <h1 className="font-bold text-lg tracking-tight text-foreground">学園祭リアルタイム混雑状況</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isFetchingGroups}
          >
            <RefreshCw className={`h-5 w-5 ${isFetchingGroups ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        {/* Dashboard Summary */}
        <section>
          {isLoadingSummary ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <p className="text-sm text-muted-foreground font-medium mb-1">参加団体</p>
                  <p className="text-3xl font-bold text-primary">{summary.totalGroups}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <p className="text-sm text-muted-foreground font-medium mb-1">更新済</p>
                  <p className="text-3xl font-bold text-green-600">{summary.updatedGroups}</p>
                </CardContent>
              </Card>
              {summary.waitCounts.slice(0, 2).map((wc) => (
                <Card key={wc.label} className="bg-card border-none shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-sm text-muted-foreground font-medium mb-1">{wc.label}</p>
                    <p className="text-3xl font-bold text-foreground">{wc.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </section>

        {/* Favorites */}
        {favoriteGroups.length > 0 && (
          <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-amber-900">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                お気に入り（{favoriteGroups.length}）
              </h2>
              <p className="text-xs text-amber-800">★を押すと追加・解除できます</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteGroups.map((g) => (
                <div
                  key={`fav-${g.name}-${g.location}`}
                  className="bg-white border border-amber-200 rounded-xl p-3 flex items-start gap-3 hover:shadow-sm transition"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleFavorite(g)}
                    className="h-7 w-7 shrink-0 text-amber-500 hover:text-amber-600 hover:bg-amber-100"
                    aria-label="お気に入りから外す"
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{displayName(g)}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{g.location}</span>
                    </p>
                    <Badge className={`mt-1.5 text-[10px] px-2 py-0 h-5 font-medium ${getWaitBadgeColor(g.wait)}`}>
                      {g.wait || "状況不明"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended (now-available) groups */}
        {recommendedGroups.length > 0 && (
          <section className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-900">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                今すぐ行ける団体
              </h2>
              <p className="text-xs text-emerald-800">空き・少し混雑だけを表示しています</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedGroups.map((g) => {
                const isFav = favorites.includes(favoriteKey(g));
                return (
                  <div key={`rec-${g.name}-${g.location}`} className="bg-white border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleFavorite(g)}
                      className={`h-7 w-7 shrink-0 ${isFav ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
                      aria-label="お気に入り切り替え"
                    >
                      <Star className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight">{displayName(g)}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{g.location}</span>
                      </p>
                      <Badge className={`mt-1.5 text-[10px] px-2 py-0 h-5 font-medium ${getWaitBadgeColor(g.wait)}`}>
                        {g.wait}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="bg-card p-4 rounded-xl shadow-sm border space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="団体名や場所で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={waitFilter} onValueChange={setWaitFilter}>
                <SelectTrigger className="bg-background">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="混雑状況" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて表示</SelectItem>
                  {summary?.waitCounts.map(wc => (
                    <SelectItem key={wc.label} value={wc.label}>{wc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                校内マップ・フロア選択
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                フロアを選択すると団体一覧が絞り込まれます。教室をタップすると詳細が表示されます。
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${editMode ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-300 hover:border-amber-400 hover:text-amber-600"}`}
              >
                {editMode ? "編集中 ✎" : "座標編集"}
              </button>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="bg-background sm:w-44">
                  <SelectValue placeholder="フロアを選択" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Empty floor alert */}
            {emptyOnSelectedFloor.length > 0 && selectedFloor !== "すべて" && (
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-emerald-800">この階に空いている団体があります！</p>
                  <p className="text-emerald-700 mt-0.5">
                    {emptyOnSelectedFloor.map((item) => `${item.point.room} ${displayName(item.group)}`).join(" / ")}
                  </p>
                </div>
              </div>
            )}

            {/* "すべて" overview */}
            {selectedFloor === "すべて" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">フロアを選択するとマップとQRコードが表示されます。</p>
                {[
                  { label: "中学棟", floors: ["中学棟3階", "中学棟4階", "中学棟5階"], color: "bg-rose-50 border-rose-200" },
                  { label: "高校棟", floors: ["高校棟3階", "高校棟4階", "高校棟5階"], color: "bg-amber-50 border-amber-200" },
                  { label: "その他", floors: ["その他"], color: "bg-slate-50 border-slate-200" },
                ].map(({ label, floors: bFloors, color }) => (
                  <div key={label} className={`rounded-xl border p-4 ${color}`}>
                    <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {bFloors.map(f => (
                        <button
                          key={f}
                          onClick={() => setSelectedFloor(f)}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single floor: QR code + floor map image */}
            {selectedFloor !== "すべて" && (() => {
              const floorUrl = `${window.location.origin}${window.location.pathname}?floor=${encodeURIComponent(selectedFloor)}`;
              const imgSrc = `${import.meta.env.BASE_URL}floormap/${encodeURIComponent(selectedFloor)}.png`;
              const floorOverlays = allMappedGroups
                .filter((item) => item.point.floor === selectedFloor)
                .filter((item, idx, arr) => arr.findIndex((a) => a.point.room === item.point.room) === idx);

              const makeDotPointerMove = (room: string) => (e: React.PointerEvent<HTMLDivElement>) => {
                if (!editMode || draggingRoom !== room || !mapContainerRef.current) return;
                e.preventDefault();
                const rect = mapContainerRef.current.getBoundingClientRect();
                const x = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
                const y = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
                setCustomPositions((prev) => ({ ...prev, [room]: { x, y } }));
              };

              const handleCopy = () => {
                const output = mapPoints
                  .filter((p) => p.floor === selectedFloor)
                  .map((p) => {
                    const pos = customPositions[p.room] ?? { x: p.x, y: p.y };
                    return `  { room: "${p.room}", floor: "${p.floor}", x: ${pos.x}, y: ${pos.y} }`;
                  })
                  .join(",\n");
                navigator.clipboard.writeText(`[\n${output}\n]`).then(() => {
                  setCopyMsg(true);
                  setTimeout(() => setCopyMsg(false), 2000);
                });
              };

              return (
                <div className="space-y-4">
                  {/* Edit mode banner */}
                  {editMode && (
                    <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-amber-800">座標編集モード</p>
                        <p className="text-xs text-amber-700 mt-0.5">ドットをドラッグして位置を調整してください。位置はブラウザに保存されます。</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const reset: Record<string, { x: number; y: number }> = { ...customPositions };
                            mapPoints.filter((p) => p.floor === selectedFloor).forEach((p) => { delete reset[p.room]; });
                            setCustomPositions(reset);
                          }}
                          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          このフロアをリセット
                        </button>
                        <button
                          onClick={handleCopy}
                          className="rounded-lg border border-amber-400 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                        >
                          {copyMsg ? "コピー済み ✓" : "座標をコピー"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QR code row */}
                  {!editMode && (
                    <div className="flex items-start gap-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                      <div className="rounded-lg border border-sky-200 bg-white p-2 shadow-sm shrink-0">
                        <QRCodeSVG value={floorUrl} size={80} level="M" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sky-900 flex items-center gap-1.5">
                          <QrCode className="h-4 w-4 text-sky-500" />
                          このフロアのQRコード
                        </p>
                        <p className="text-xs text-sky-700 mt-1">読み込むと <strong>{selectedFloor}</strong> のマップが直接開きます。</p>
                        <p className="text-[10px] text-sky-500 mt-1.5 font-mono break-all">{floorUrl}</p>
                      </div>
                    </div>
                  )}

                  {/* Floor map image with wait-status overlays */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div
                      ref={mapContainerRef}
                      className={`relative select-none ${editMode ? "cursor-crosshair" : ""}`}
                    >
                      <img
                        src={imgSrc}
                        alt={`${selectedFloor} フロアマップ`}
                        className="w-full h-auto block pointer-events-none"
                        draggable={false}
                      />
                      {floorOverlays.map((item) => {
                        const pos = customPositions[item.point.room] ?? { x: item.point.x, y: item.point.y };
                        const visual = getWaitVisual(item.group.wait);
                        const isDragging = draggingRoom === item.point.room;
                        return (
                          <div
                            key={item.point.room}
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-0.5 ${editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer group"} ${isDragging ? "scale-125 z-20" : ""} transition-transform`}
                            onPointerDown={(e) => {
                              if (!editMode) return;
                              e.preventDefault();
                              e.currentTarget.setPointerCapture(e.pointerId);
                              setDraggingRoom(item.point.room);
                            }}
                            onPointerMove={makeDotPointerMove(item.point.room)}
                            onPointerUp={() => setDraggingRoom(null)}
                            onPointerCancel={() => setDraggingRoom(null)}
                            onClick={() => {
                              if (editMode) return;
                              setSelectedGroupInfo({
                                name: item.group.name,
                                wait: item.group.wait ?? "不明",
                                location: item.group.location,
                                desc: item.group.desc,
                                room: item.point.room,
                              });
                            }}
                          >
                            <div className={`w-6 h-6 rounded-full ${visual.dot} ring-2 ${visual.ring} shadow-lg flex items-center justify-center ${editMode ? "" : "group-hover:scale-125"} transition-transform`}>
                              <span className="text-[7px] font-black text-white leading-none select-none">{visual.label.slice(0, 2)}</span>
                            </div>
                            <span className={`text-[8px] font-bold bg-black/70 text-white rounded px-1 py-0.5 leading-tight whitespace-nowrap shadow select-none ${editMode ? "bg-amber-700/80" : ""}`}>
                              {item.point.room}
                            </span>
                            {editMode && (
                              <span className="text-[7px] text-amber-200 bg-black/60 rounded px-0.5 leading-tight select-none">
                                {pos.x},{pos.y}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dot legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
                    {[
                      { dot: "bg-emerald-500", label: "空き・待ちなし" },
                      { dot: "bg-amber-500", label: "少し混雑" },
                      { dot: "bg-rose-600", label: "混雑・終了" },
                      { dot: "bg-slate-400", label: "準備中・休止" },
                    ].map(({ dot, label }) => (
                      <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className={`inline-block w-3 h-3 rounded-full ${dot} shrink-0`} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </section>

        {/* Group detail modal */}
        {selectedGroupInfo && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedGroupInfo(null)}
          >
            <div
              className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-primary/10 border-b px-5 py-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{selectedGroupInfo.room} · {selectedGroupInfo.location}</p>
                  <h3 className="text-xl font-bold text-foreground leading-tight">{displayName(selectedGroupInfo)}</h3>
                </div>
                <button
                  onClick={() => setSelectedGroupInfo(null)}
                  className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground mt-0.5"
                  aria-label="閉じる"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l12 12M14 2L2 14" /></svg>
                </button>
              </div>
              {/* Modal body */}
              <div className="px-5 py-4 space-y-4">
                {selectedGroupInfo.wait && (
                  <Badge className={`text-sm px-3 py-1 ${getWaitBadgeColor(selectedGroupInfo.wait)}`}>
                    {selectedGroupInfo.wait}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {selectedGroupInfo.desc || "説明はまだ登録されていません。"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{selectedGroupInfo.location}</span>
                </div>
              </div>
              {/* Modal footer */}
              <div className="px-5 py-3 border-t bg-muted/30 flex justify-between items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const g = { name: selectedGroupInfo.name, location: selectedGroupInfo.location };
                    toggleFavorite(g);
                  }}
                  className={favorites.includes(favoriteKey(selectedGroupInfo)) ? "text-amber-500 border-amber-300" : ""}
                >
                  <Star className={`h-4 w-4 mr-1.5 ${favorites.includes(favoriteKey(selectedGroupInfo)) ? "fill-current" : ""}`} />
                  {favorites.includes(favoriteKey(selectedGroupInfo)) ? "お気に入り済み" : "お気に入りに追加"}
                </Button>
                <Button size="sm" onClick={() => setSelectedGroupInfo(null)}>閉じる</Button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule */}
        <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                イベントスケジュール
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                9:00〜17:00を30分刻みで表示。今やっているイベントは緑で「やっています」と表示します。
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              現在時刻: <span className="font-mono font-bold text-foreground">{now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {activeEvents.length > 0 && (
            <div className="px-5 pt-4 space-y-2">
              {activeEvents.map((ev) => (
                <div key={ev.id} className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-800">{ev.venue}：{ev.title} やっています</p>
                    <p className="text-xs text-emerald-700">
                      開催時間 {Math.floor((ev.startMinutes + SCHEDULE_START_HOUR * 60) / 60).toString().padStart(2, "0")}:{((ev.startMinutes) % 60).toString().padStart(2, "0")}
                      〜
                      {Math.floor((ev.endMinutes + SCHEDULE_START_HOUR * 60) / 60).toString().padStart(2, "0")}:{((ev.endMinutes) % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid" style={{ gridTemplateColumns: `60px repeat(${scheduleVenues.length}, minmax(0, 1fr))` }}>
                <div className="text-xs font-bold text-muted-foreground p-2 border-b border-r">時刻</div>
                {scheduleVenues.map((venue) => (
                  <div key={venue} className="text-xs font-bold text-foreground p-2 border-b text-center bg-muted/30">{venue}</div>
                ))}
                {scheduleSlots.map((slot, slotIdx) => (
                  <div key={slot.label} className="contents">
                    <div className="text-[10px] font-mono text-muted-foreground p-1 border-r border-b text-right">{slot.label}</div>
                    {scheduleVenues.map((venue) => {
                      const eventStarting = scheduleEvents.find(
                        (ev) => ev.venue === venue && ev.startMinutes === slot.startMinutes,
                      );
                      const eventCovers = scheduleEvents.find(
                        (ev) =>
                          ev.venue === venue &&
                          slot.startMinutes >= ev.startMinutes &&
                          slot.startMinutes < ev.endMinutes,
                      );
                      const isNowSlot = nowMinutes >= slot.startMinutes && nowMinutes < slot.startMinutes + 30;
                      const isActive = eventCovers && nowMinutes >= eventCovers.startMinutes && nowMinutes < eventCovers.endMinutes;

                      if (eventStarting) {
                        const spanSlots = (eventStarting.endMinutes - eventStarting.startMinutes) / 30;
                        return (
                          <div
                            key={`${venue}-${slot.label}`}
                            className={`relative border-b p-1.5 text-[11px] leading-tight rounded-md m-0.5 ${
                              isActive
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : "bg-primary/15 text-primary border-primary/30"
                            }`}
                            style={{ gridRow: `span ${spanSlots}` }}
                          >
                            <p className="font-bold">{eventStarting.title}</p>
                            {isActive && <p className="text-[9px] font-bold mt-0.5">やっています</p>}
                          </div>
                        );
                      }
                      if (eventCovers) {
                        return null;
                      }
                      return (
                        <div
                          key={`${venue}-${slot.label}`}
                          className={`border-b min-h-[28px] ${slotIdx % 2 === 0 ? "bg-muted/10" : ""} ${isNowSlot ? "ring-1 ring-inset ring-rose-300 bg-rose-50/50" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Group List */}
        <section>
          {isLoadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group, idx) => {
                const isFav = favorites.includes(favoriteKey(group));
                return (
                <Card key={idx} className="overflow-hidden hover:shadow-md transition-all duration-200 border border-border group">
                  <CardHeader className="p-5 pb-4 border-b bg-muted/30">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{displayName(group)}</CardTitle>
                        <CardDescription className="mt-1.5 flex items-center text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {group.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFavorite(group)}
                          className={`h-8 w-8 ${isFav ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"}`}
                          aria-label={isFav ? "お気に入りから外す" : "お気に入りに追加"}
                          title={isFav ? "お気に入りから外す" : "お気に入りに追加"}
                        >
                          <Star className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
                        </Button>
                        {group.logo && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border bg-background">
                            <img src={group.logo} alt={group.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-sm px-3 py-1 font-medium ${getWaitBadgeColor(group.wait)}`}>
                        {group.wait || "状況不明"}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {group.updatedAt ? formatDistanceToNow(group.updatedAt, { addSuffix: true, locale: ja }) : "更新なし"}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                      {group.desc}
                    </p>

                    {group.comment && (
                      <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-3 text-sm flex gap-2 items-start">
                        <Info className="w-4 h-4 text-secondary-foreground shrink-0 mt-0.5" />
                        <p className="text-secondary-foreground leading-snug">{group.comment}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t bg-muted/10 flex justify-between items-center text-xs text-muted-foreground">
                    <span>営業時間: {group.hours || "不明"}</span>
                  </CardFooter>
                </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">見つかりませんでした</h3>
              <p className="text-muted-foreground">検索条件に一致する団体がありません。</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setWaitFilter("all");
                  setSelectedFloor("すべて");
                }}
              >
                条件をクリア
              </Button>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t bg-card py-8">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>学園祭リアルタイム混雑状況システム</p>
            {groupsPayload?.fetchedAt && (
              <p className="text-xs mt-1 opacity-70">
                最終データ取得: {new Date(groupsPayload.fetchedAt).toLocaleString('ja-JP')}
              </p>
            )}
          </div>
          
          {groupsPayload?.source && (
            <div className="flex gap-4">
              <Button variant="link" size="sm" asChild className="text-primary hover:text-primary/80">
                <a href={groupsPayload.source.registrationFormUrl} target="_blank" rel="noopener noreferrer">
                  団体登録
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/5">
                <a href={groupsPayload.source.updateFormUrl} target="_blank" rel="noopener noreferrer">
                  混雑状況を更新
                </a>
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
