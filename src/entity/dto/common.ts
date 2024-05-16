export interface PaginationQuery {
    per_page: number;
    page: number;
    sort: string;
    search?: string;
}
