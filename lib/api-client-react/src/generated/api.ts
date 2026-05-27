import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";

(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
  request?: RequestInit;
}) => {
  const { query } = options ?? {};
  const queryKey = query?.queryKey ?? getHealthCheckQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof healthCheck>>
  > = () => healthCheck();

  return {
    queryKey,
    queryFn,
    ...query,
  } as UseQueryOptions<
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
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof healthCheck>>,
    TError,
    TData
  >;
  request?: RequestInit;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<
    TData,
    TError
  > & {
    queryKey: QueryKey;
  };

  return {
    ...query,
    queryKey: queryOptions.queryKey,
  };
}

export const getListFestivalGroupsUrl = () =>
  `${APPS_SCRIPT_WEBAPP_URL}?action=groups`;

export const listFestivalGroups =
  async (): Promise<FestivalGroupsPayload> => {
    const payload = await jsonp<
      GasGroup[] | { data?: GasGroup[]; fetchedAt?: unknown }
    >({
      action: "groups",
    });

    const rawGroups = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : [];

    const fetchedAt = Array.isArray(payload)
      ? null
      : numberOrNull(payload.fetchedAt);

    return {
      fetchedAt: fetchedAt ?? Date.now(),
      groups: rawGroups
        .map(normalizeGroup)
        .filter((group) => group.name),

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
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listFestivalGroups>>,
    TError,
    TData
  >;

  request?: RequestInit;
}) => {
  const { query } = options ?? {};

  const queryKey =
    query?.queryKey ?? getListFestivalGroupsQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listFestivalGroups>>
  > = () => listFestivalGroups();

  return {
    queryKey,
    queryFn,
    ...query,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof listFestivalGroups>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListFestivalGroupsQueryResult = NonNullable<
  Awaited<ReturnType<typeof listFestivalGroups>>
>;

export type ListFestivalGroupsQueryError =
  ErrorType<ErrorResponse>;

export function useListFestivalGroups<
  TData = Awaited<ReturnType<typeof listFestivalGroups>>,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listFestivalGroups>>,
    TError,
    TData
  >;

  request?: RequestInit;
}): UseQueryResult<TData, TError> & {
  queryKey: QueryKey;
} {
  const queryOptions =
    getListFestivalGroupsQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<
    TData,
    TError
  > & {
    queryKey: QueryKey;
  };

  return {
    ...query,
    queryKey: queryOptions.queryKey,
  };
}

