import { useListFestivalGroups, getListFestivalGroupsQueryKey, useGetFestivalSummary, getGetFestivalSummaryQueryKey } from "@workspace/api-client-react";
import { useState, useMemo, useEffect, useCallback } from "react";
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

  const displayName = useCallback(
    (g: { name: string; location: string } | undefined | null): string => {
      if (!g) return "";
      return g.name;
    },
    [],
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
    
    return filtered;
  }, [groupsPayload?.groups, searchQuery, waitFilter]);

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
      default: {
        const min = parseInt(wait, 10);
        if (!isNaN(min)) {
          if (min === 0)  return "bg-green-500 hover:bg-green-600 text-white border-transparent";
          if (min <= 15)  return "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent";
          if (min <= 30)  return "bg-red-400 hover:bg-red-500 text-white border-transparent";
          return "bg-red-600 hover:bg-red-700 text-white border-transparent";
        }
        return "bg-gray-400 hover:bg-gray-500 text-white border-transparent";
      }
    }
  };

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
            <h1 className="font-bold text-lg tracking-tight text-foreground">打越祭リアルタイム混雑状況</h1>
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
                フロアを選択するとマップとQRコードが表示されます。
              </p>
            </div>
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

          <div className="p-5 space-y-5">
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
              return (
                <div className="space-y-4">
                  {/* QR code row */}
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

                  {/* Floor map image */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={`${selectedFloor} フロアマップ`}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              );
            })()}

          </div>
        </section>

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
            <p>打越祭リアルタイム混雑状況システム</p>
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
