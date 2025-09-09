import type { Checklist } from "@/drizzle/schema/rounds";

export type UpdateData = {
    time?: Date;
    user_id?: number;
    status?: string;
    checklist?: Checklist;
    notes?: string | null;
}