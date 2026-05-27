import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";

export const getHealthCheckQueryOptions = <
  TData = Awaited<ReturnType<typeof healthCheck>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof healthCheck>>,
    TError,
    TData
  >;
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
