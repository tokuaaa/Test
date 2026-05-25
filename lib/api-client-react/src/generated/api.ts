  customFetch<HealthStatus>(getHealthCheckUrl(), { ...options, method: "GET" });
export const getHealthCheckQueryKey = () => [`/api/healthz`] as const;
export const getHealthCheckQueryOptions = <
  TData = Awaited<ReturnType<typeof healthCheck>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query, request } = options ?? {};
  const queryKey = query?.queryKey ?? getHealthCheckQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof healthCheck>>> = ({
    signal,
  }) => healthCheck({ signal, ...request });
  return { queryKey, queryFn, ...query } as UseQueryOptions<
    Awaited<ReturnType<typeof healthCheck>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};
export type HealthCheckQueryResult = NonNullable<
  Awaited<ReturnType<typeof healthCheck>>
>;
export type HealthCheckQueryError = ErrorType<unknown>;
export function useHealthCheck<
  TData = Awaited<ReturnType<typeof healthCheck>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
export const getListFestivalGroupsUrl = () =>
  `${APPS_SCRIPT_WEBAPP_URL}?action=groups`;
export const listFestivalGroups = async (): Promise<FestivalGroupsPayload> => {
  const payload = await jsonp<GasGroup[] | { data?: GasGroup[]; fetchedAt?: unknown }>({
    action: "groups",
  });
  const rawGroups = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  const fetchedAt = Array.isArray(payload) ? null : numberOrNull(payload.fetchedAt);
  return {
    fetchedAt: fetchedAt ?? Date.now(),
    groups: rawGroups.map(normalizeGroup).filter((group) => group.name),
    source: {
      spreadsheetId: SPREADSHEET_ID,
      registrationFormUrl: REGISTRATION_FORM_URL,
      updateFormUrl: UPDATE_FORM_URL,
    },
  };
};
export const getListFestivalGroupsQueryKey = () =>
  [`apps-script`, `festival`, `groups`] as const;
export const getListFestivalGroupsQueryOptions = <
  TData = Awaited<ReturnType<typeof listFestivalGroups>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof listFestivalGroups>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query } = options ?? {};
  const queryKey = query?.queryKey ?? getListFestivalGroupsQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listFestivalGroups>>> =
    () => listFestivalGroups();
  return { queryKey, queryFn, ...query } as UseQueryOptions<
    Awaited<ReturnType<typeof listFestivalGroups>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};
export type ListFestivalGroupsQueryResult = NonNullable<
  Awaited<ReturnType<typeof listFestivalGroups>>
>;
export type ListFestivalGroupsQueryError = ErrorType<ErrorResponse>;
export function useListFestivalGroups<
  TData = Awaited<ReturnType<typeof listFestivalGroups>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof listFestivalGroups>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListFestivalGroupsQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
export const getGetFestivalSummaryUrl = () =>
  `${APPS_SCRIPT_WEBAPP_URL}?action=groups`;
export const getFestivalSummary = async (): Promise<FestivalSummary> => {
  const payload = await listFestivalGroups();
  const waitCounts = new Map<string, number>();
  let newestUpdatedAt: number | null = null;
  payload.groups.forEach((group) => {
    waitCounts.set(group.wait, (waitCounts.get(group.wait) ?? 0) + 1);
    if (group.updatedAt && (!newestUpdatedAt || group.updatedAt > newestUpdatedAt)) {
      newestUpdatedAt = group.updatedAt;
    }
  });
  return {
    fetchedAt: payload.fetchedAt,
    totalGroups: payload.groups.length,
    updatedGroups: payload.groups.filter((group) => group.updatedAt !== null).length,
    staleGroups: payload.groups.filter(
      (group) => group.updatedAgo !== null && group.updatedAgo > 30,
    ).length,
    waitCounts: Array.from(waitCounts.entries()).map(([label, count]) => ({
      label,
      count,
    })),
    newestUpdatedAt,
  };
};
export const getGetFestivalSummaryQueryKey = () =>
  [`apps-script`, `festival`, `summary`] as const;
export const getGetFestivalSummaryQueryOptions = <
  TData = Awaited<ReturnType<typeof getFestivalSummary>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getFestivalSummary>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query } = options ?? {};
  const queryKey = query?.queryKey ?? getGetFestivalSummaryQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getFestivalSummary>>> =
    () => getFestivalSummary();
  return { queryKey, queryFn, ...query } as UseQueryOptions<
    Awaited<ReturnType<typeof getFestivalSummary>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};
export type GetFestivalSummaryQueryResult = NonNullable<
  Awaited<ReturnType<typeof getFestivalSummary>>
>;
export type GetFestivalSummaryQueryError = ErrorType<ErrorResponse>;
export function useGetFestivalSummary<
  TData = Awaited<ReturnType<typeof getFestivalSummary>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getFestivalSummary>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetFestivalSummaryQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}
