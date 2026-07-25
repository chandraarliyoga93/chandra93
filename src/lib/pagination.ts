export interface PaginationParams {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function getPaginationParams(searchParams: { [key: string]: string | string[] | undefined }): PaginationParams {
  const page = Math.max(1, Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) || 1);
  const limit = Math.max(1, Number(Array.isArray(searchParams.limit) ? searchParams.limit[0] : searchParams.limit) || 10);
  const search = String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || "");
  const sortBy = String(Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort || "createdAt");
  
  const rawOrder = Array.isArray(searchParams.order) ? searchParams.order[0] : searchParams.order;
  const sortOrder: 'asc' | 'desc' = rawOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  };
}
