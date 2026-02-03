export type ProcurementStatus = 'active' | 'archived';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

// Location Hierarchy Types
export interface Cabinet {
    id: string;
    name: string;
    code: string; // e.g., "C1", "C2"
    description?: string;
    createdAt: string;
}

export interface Shelf {
    id: string;
    cabinetId: string;
    name: string;
    code: string; // e.g., "S1", "S2"
    description?: string;
    createdAt: string;
}

export interface Folder {
    id: string;
    shelfId: string;
    name: string;
    code: string; // e.g., "F1", "F2"
    description?: string;
    createdAt: string;
}

// Simplified Procurement (File Record)
export interface Procurement {
    id: string;
    prNumber: string;
    description: string;
    dateAdded: string;

    // Location tracking (Cabinet > Shelf > Folder)
    cabinetId: string;
    shelfId: string;
    folderId: string;

    // Status
    status: ProcurementStatus;
    urgencyLevel: UrgencyLevel;

    // Optional metadata
    tags: string[];
    notes?: string;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

export interface ProcurementFilters {
    search: string;
    cabinetId: string;
    shelfId: string;
    folderId: string;
    status: ProcurementStatus | '';
    monthYear: string;
    urgencyLevel: UrgencyLevel | '';
}

export interface DashboardMetrics {
    total: number;
    active: number;
    archived: number;
    critical: number;
}

export interface LocationStats {
    cabinetId: string;
    cabinetName: string;
    count: number;
}

// Helper type for location display
export interface LocationPath {
    cabinet: Cabinet;
    shelf: Shelf;
    folder: Folder;
    fullPath: string; // e.g., "C1-S2-F14"
}
