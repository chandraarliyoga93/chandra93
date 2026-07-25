import {
  createParser,
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum
} from "nuqs/server";
import { z } from "zod";

import { dataTableConfig } from "@/config/data-table";

import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
} from "@/types/data-table";

/**
 * URL search parameter parsers for the student directory.
 * Used by both client components (via useQueryStates) and 
 * server components (via searchParamsCache).
 */
export const studentSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  sortBy: parseAsString.withDefault("name"),
  sortOrder: parseAsStringEnum(["asc", "desc"]).withDefault("asc"),
  selected: parseAsString, // Used for the student details drawer/side-panel
};

export const attendanceSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  tab: parseAsString.withDefault("input"),
  date: parseAsString,
};

export const attendanceHistorySearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
};

export const gamificationSearchParams = {
  classId: parseAsString,
  tab: parseAsString.withDefault("leaderboard"),
};

export const examSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  type: parseAsString,
  status: parseAsString,
};

export const questionSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  type: parseAsString,
  sortBy: parseAsString.withDefault("createdAt"),
  sortOrder: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
};

export const passageSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
};

/**
 * Cache for parsing search params on the server side.
 * usage: studentSearchParamsCache.parse(searchParams)
 */
export const studentSearchParamsCache = createSearchParamsCache(studentSearchParams);
export const attendanceSearchParamsCache = createSearchParamsCache(attendanceSearchParams);
export const attendanceHistorySearchParamsCache = createSearchParamsCache(attendanceHistorySearchParams);
export const gamificationSearchParamsCache = createSearchParamsCache(gamificationSearchParams);
export const examSearchParamsCache = createSearchParamsCache(examSearchParams);
export const questionSearchParamsCache = createSearchParamsCache(questionSearchParams);
export const passageSearchParamsCache = createSearchParamsCache(passageSearchParams);

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>,
) => {
  const validKeys = columnIds
    ? columnIds instanceof Set
      ? columnIds
      : new Set(columnIds)
    : null;

  return createParser({
    parse: (value) => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(sortingItemSchema).safeParse(parsed);

        if (!result.success) return null;

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnSort<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (item, index) =>
          item.id === b[index]?.id && item.desc === b[index]?.desc,
      ),
  });
};

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const getFiltersStateParser = <TData>(
  columnIds?: string[] | Set<string>,
) => {
  const validKeys = columnIds
    ? columnIds instanceof Set
      ? columnIds
      : new Set(columnIds)
    : null;

  return createParser({
    parse: (value) => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(filterItemSchema).safeParse(parsed);

        if (!result.success) return null;

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnFilter<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (filter, index) =>
          filter.id === b[index]?.id &&
          filter.value === b[index]?.value &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator,
      ),
  });
};
