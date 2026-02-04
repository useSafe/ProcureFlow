import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { deleteProcurement, updateProcurement, onProcurementsChange, onCabinetsChange, onShelvesChange, onFoldersChange } from '@/lib/storage';
import { Procurement, Cabinet, Shelf, Folder, ProcurementStatus, UrgencyLevel, ProcurementFilters } from '@/types/procurement';
import { toast } from 'sonner';
import {
    Plus,
    Search,
    MoreVertical,
    FileText,
    Trash2,
    Pencil,
    ChevronLeft,
    ChevronRight,
    MapPin,
    FilterX,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProcurementList: React.FC = () => {
    const { user } = useAuth();
    const [procurements, setProcurements] = useState<Procurement[]>([]);

    // Location Data - Note: cabinets table stores Shelves (Tier 1), shelves table stores Cabinets (Tier 2)
    const [cabinets, setCabinets] = useState<Cabinet[]>([]); // These are actually Shelves (Tier 1)
    const [shelves, setShelves] = useState<Shelf[]>([]); // These are actually Cabinets (Tier 2)
    const [folders, setFolders] = useState<Folder[]>([]);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingProcurement, setEditingProcurement] = useState<Procurement | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    // Dynamic Edit Form Data
    const [editAvailableShelves, setEditAvailableShelves] = useState<Shelf[]>([]);
    const [editAvailableFolders, setEditAvailableFolders] = useState<Folder[]>([]);

    // Filters
    const [filters, setFilters] = useState<ProcurementFilters>({
        search: '',
        cabinetId: '',
        shelfId: '',
        folderId: '',
        status: '',
        monthYear: '',
        urgencyLevel: '',
    });

    const itemsPerPage = 10;

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubProcurements = onProcurementsChange(setProcurements);
        const unsubCabinets = onCabinetsChange(setCabinets);
        const unsubShelves = onShelvesChange(setShelves);
        const unsubFolders = onFoldersChange(setFolders);

        return () => {
            unsubProcurements();
            unsubCabinets();
            unsubShelves();
            unsubFolders();
        };
    }, []);

    // Update edit form cascading dropdowns
    useEffect(() => {
        if (editingProcurement && editingProcurement.cabinetId) {
            setEditAvailableShelves(shelves.filter(s => s.cabinetId === editingProcurement.cabinetId));
        } else {
            setEditAvailableShelves([]);
        }
    }, [editingProcurement?.cabinetId, shelves]);

    useEffect(() => {
        if (editingProcurement && editingProcurement.shelfId) {
            setEditAvailableFolders(folders.filter(f => f.shelfId === editingProcurement.shelfId));
        } else {
            setEditAvailableFolders([]);
        }
    }, [editingProcurement?.shelfId, folders]);

    const filteredProcurements = (procurements || []).filter(procurement => {
        const matchesSearch =
            procurement.prNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
            procurement.description.toLowerCase().includes(filters.search.toLowerCase());

        const matchesCabinet = !filters.cabinetId || filters.cabinetId === 'all_cabinets' || procurement.cabinetId === filters.cabinetId;
        const matchesStatus = !filters.status || filters.status === 'all_status' || procurement.status === filters.status;
        const matchesUrgency = !filters.urgencyLevel || filters.urgencyLevel === 'all_urgency' || procurement.urgencyLevel === filters.urgencyLevel;

        return matchesSearch && matchesCabinet && matchesStatus && matchesUrgency;
    });

    const totalPages = Math.ceil(filteredProcurements.length / itemsPerPage);
    const paginatedProcurements = filteredProcurements.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: ProcurementStatus) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'archived': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            cabinetId: '',
            shelfId: '',
            folderId: '',
            status: '',
            monthYear: '',
            urgencyLevel: '',
        });
        setCurrentPage(1);
    };

    const handleEdit = (procurement: Procurement) => {
        setEditingProcurement(procurement);
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingProcurement) return;

        try {
            await updateProcurement(
                editingProcurement.id,
                editingProcurement,
                user?.email,
                user?.name
            );
            setIsEditDialogOpen(false);
            setEditingProcurement(null);
            toast.success('Record updated successfully');
        } catch (error) {
            toast.error('Failed to update record');
        }
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteProcurement(deleteId);
            toast.success('Record deleted successfully');
            setDeleteId(null);
        }
    };

    // Updated to show: Shelf-Cabinet-Folder (S1-C1-F1)
    const getLocationString = (p: Procurement) => {
        const shelf = cabinets.find(c => c.id === p.cabinetId)?.code || '?'; // cabinetId points to Shelf (Tier 1)
        const cabinet = shelves.find(s => s.id === p.shelfId)?.code || '?'; // shelfId points to Cabinet (Tier 2)
        const folder = folders.find(f => f.id === p.folderId)?.code || '?'; // folderId points to Folder (Tier 3)
        return `${shelf}-${cabinet}-${folder}`;
    };

    const exportToCSV = () => {
        const exportData = filteredProcurements.map(p => {
            const shelf = cabinets.find(c => c.id === p.cabinetId);
            const cabinet = shelves.find(s => s.id === p.shelfId);
            const folder = folders.find(f => f.id === p.folderId);

            return {
                'PR Number': p.prNumber,
                'Description': p.description,
                'Location': getLocationString(p),
                'Shelf': shelf?.name || '',
                'Cabinet': cabinet?.name || '',
                'Folder': folder?.name || '',
                'Status': p.status.charAt(0).toUpperCase() + p.status.slice(1),
                'Date Added': format(new Date(p.dateAdded), 'MMM d, yyyy'),
                'Created At': format(new Date(p.createdAt), 'MMM d, yyyy HH:mm'),
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `procurement_records_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        toast.success('Exported to CSV successfully');
    };

    const handleExportExcel = () => {
        const exportData = filteredProcurements.map(p => ({
            'PR Number': p.prNumber,
            'Description': p.description,
            'Location': getLocationString(p),
            'Status': p.status,
            'Urgency': p.urgencyLevel,
            'Date Added': format(new Date(p.dateAdded), 'MMM d, yyyy'),
            'Tags': p.tags.join(', '),
            'Notes': p.notes || '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Procurements');

        // Generate filename with current date
        const filename = `procurement-records-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, filename);

        toast.success('Excel file exported successfully');
    };

    const handleExportPDFSummary = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Procurement Records - Summary Report', 14, 20);

        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy - hh:mm a')}`, 14, 28);

        // Summary data
        const summaryData = filteredProcurements.map(p => [
            p.prNumber,
            p.description.substring(0, 40) + (p.description.length > 40 ? '...' : ''),
            getLocationString(p),
            p.status,
            format(new Date(p.dateAdded), 'MMM d, yyyy')
        ]);

        autoTable(doc, {
            head: [['PR Number', 'Description', 'Location', 'Status', 'Date Added']],
            body: summaryData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { fontSize: 9 },
        });

        doc.save(`procurement-summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('PDF summary exported successfully');
    };

    const handleExportPDFFull = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Procurement Records - Full Report', 14, 20);

        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy - hh:mm a')}`, 14, 28);

        // Full data
        const fullData = filteredProcurements.map(p => [
            p.prNumber,
            p.description.substring(0, 30) + (p.description.length > 30 ? '...' : ''),
            getLocationString(p),
            p.status,
            p.urgencyLevel,
            format(new Date(p.dateAdded), 'MMM d, yyyy'),
            p.tags.join(', ').substring(0, 20),
            p.createdByName || 'N/A'
        ]);

        autoTable(doc, {
            head: [['PR #', 'Description', 'Location', 'Status', 'Urgency', 'Date', 'Tags', 'Created By']],
            body: fullData,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { fontSize: 8 },
        });

        doc.save(`procurement-full-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('PDF full report exported successfully');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;

        try {
            await deleteProcurement(deleteId);
            toast.success('Record deleted successfully');
            setDeleteId(null);
            // Remove from selection if it was selected
            if (selectedIds.includes(deleteId)) {
                setSelectedIds(prev => prev.filter(id => id !== deleteId));
            }
        } catch (error) {
            toast.error('Failed to delete record');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const currentIds = paginatedProcurements.map(p => p.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
        } else {
            const currentIds = paginatedProcurements.map(p => p.id);
            setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        try {
            // Delete all selected records
            // In a real app, this should be a batch operation or use Promise.all
            // For now, we'll iterate
            await Promise.all(selectedIds.map(id => deleteProcurement(id)));

            toast.success(`${selectedIds.length} records deleted successfully`);
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Failed to delete some records');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Records</h1>

                    <p className="text-slate-400 mt-1">View and manage file tracking records</p>
                </div>

                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected ({selectedIds.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1e293b] border-slate-800 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete {selectedIds.length} Records?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        This action cannot be undone. This will permanently delete the selected procurement records.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete All</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-slate-700 text-white">
                            <DropdownMenuItem
                                onClick={exportToCSV}
                                className="cursor-pointer focus:bg-slate-700"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleExportExcel}
                                className="cursor-pointer focus:bg-slate-700"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Export as Excel
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="border-none bg-[#0f172a] shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search PR Number or description..."
                                className="pl-9 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-[#1e293b] rounded-md border border-slate-700 p-1">
                                <Select
                                    value={filters.cabinetId}
                                    onValueChange={(value) => setFilters({ ...filters, cabinetId: value })}
                                >
                                    <SelectTrigger className="w-[150px] border-none bg-transparent text-white focus:ring-0">
                                        <SelectValue placeholder="Shelf" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                        <SelectItem value="all_cabinets">All Shelves</SelectItem>
                                        {cabinets.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 bg-[#1e293b] rounded-md border border-slate-700 p-1">
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => setFilters({ ...filters, status: value as ProcurementStatus })}
                                >
                                    <SelectTrigger className="w-[120px] border-none bg-transparent text-white focus:ring-0">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                        <SelectItem value="all_status">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={clearFilters}
                                className="bg-[#1e293b] border-slate-700 text-slate-400 hover:text-white"
                                title="Clear Filters"
                            >
                                <FilterX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={paginatedProcurements.length > 0 && paginatedProcurements.every(p => selectedIds.includes(p.id))}
                                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                            className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                    </TableHead>
                                    <TableHead className="text-slate-300">PR Number</TableHead>
                                    <TableHead className="text-slate-300">Description</TableHead>
                                    <TableHead className="text-slate-300">Location</TableHead>
                                    <TableHead className="text-slate-300">Status</TableHead>
                                    <TableHead className="text-slate-300">Date</TableHead>
                                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProcurements.length === 0 ? (
                                    <TableRow className="border-slate-800">
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedProcurements.map((procurement) => (
                                        <TableRow key={procurement.id} className="border-slate-800 hover:bg-[#1e293b]">
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(procurement.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(procurement.id, checked as boolean)}
                                                    className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-white">
                                                {procurement.prNumber}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-slate-400">
                                                {procurement.description}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <MapPin className="h-3 w-3 text-blue-500" />
                                                    <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded">
                                                        {getLocationString(procurement)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(procurement.status)}`}>
                                                    {procurement.status.charAt(0).toUpperCase() + procurement.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-400">
                                                {format(new Date(procurement.dateAdded), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-slate-700 text-white">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEdit(procurement)}
                                                                className="cursor-pointer focus:bg-slate-700"
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                                    onClick={() => setDeleteId(procurement.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent className="bg-[#1e293b] border-slate-800 text-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-400">
                                                                This action cannot be undone. This will permanently delete the procurement record.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="bg-[#1e293b] border-slate-700 text-white disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="bg-[#1e293b] border-slate-700 text-white disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                )}
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="border-slate-800 bg-[#0f172a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Record</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Update the procurement details and location.
                        </DialogDescription>
                    </DialogHeader>

                    {editingProcurement && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">PR Number</Label>
                                    <Input
                                        value={editingProcurement.prNumber}
                                        onChange={(e) => setEditingProcurement({ ...editingProcurement, prNumber: e.target.value })}
                                        className="bg-[#1e293b] border-slate-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Date Added</Label>
                                    <Input
                                        value={format(new Date(editingProcurement.dateAdded), 'yyyy-MM-dd')}
                                        disabled
                                        className="bg-[#1e293b]/50 border-slate-700 text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Description</Label>
                                <Textarea
                                    value={editingProcurement.description}
                                    onChange={(e) => setEditingProcurement({ ...editingProcurement, description: e.target.value })}
                                    className="bg-[#1e293b] border-slate-700 text-white"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2 border-t border-slate-800 pt-4">
                                <Label className="text-lg font-semibold text-white">Location</Label>
                                <p className="text-xs text-slate-400">Shelf → Cabinet → Folder</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Shelf</Label>
                                    <Select
                                        value={editingProcurement.cabinetId}
                                        onValueChange={(val) => setEditingProcurement({
                                            ...editingProcurement,
                                            cabinetId: val,
                                            shelfId: '', // Reset child
                                            folderId: '' // Reset child
                                        })}
                                    >
                                        <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            {cabinets.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Cabinet</Label>
                                    <Select
                                        value={editingProcurement.shelfId}
                                        onValueChange={(val) => setEditingProcurement({
                                            ...editingProcurement,
                                            shelfId: val,
                                            folderId: '' // Reset child
                                        })}
                                        disabled={!editingProcurement.cabinetId}
                                    >
                                        <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            {editAvailableShelves.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Folder</Label>
                                    <Select
                                        value={editingProcurement.folderId}
                                        onValueChange={(val) => setEditingProcurement({ ...editingProcurement, folderId: val })}
                                        disabled={!editingProcurement.shelfId}
                                    >
                                        <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            {editAvailableFolders.map((f) => (
                                                <SelectItem key={f.id} value={f.id}>{f.code} - {f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Status</Label>
                                    <Select
                                        value={editingProcurement.status}
                                        onValueChange={(val) => setEditingProcurement({ ...editingProcurement, status: val as ProcurementStatus })}
                                    >
                                        <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Record History Section */}
                            <div className="space-y-4 border-t border-slate-800 pt-4">
                                <Label className="text-lg font-semibold text-white">Record History</Label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Created By</Label>
                                        <Input
                                            value={`${editingProcurement.createdByName || 'Unknown'} (${editingProcurement.createdBy || 'N/A'})`}
                                            disabled
                                            className="bg-[#1e293b]/50 border-slate-700 text-slate-400 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Created At</Label>
                                        <Input
                                            value={format(new Date(editingProcurement.createdAt), 'MMMM d, yyyy - hh:mm a')}
                                            disabled
                                            className="bg-[#1e293b]/50 border-slate-700 text-slate-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {editingProcurement.editedBy && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Last Edited By</Label>
                                            <Input
                                                value={`${editingProcurement.editedByName || 'Unknown'} (${editingProcurement.editedBy})`}
                                                disabled
                                                className="bg-[#1e293b]/50 border-slate-700 text-slate-400 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Last Edited At</Label>
                                            <Input
                                                value={editingProcurement.lastEditedAt ? format(new Date(editingProcurement.lastEditedAt), 'MMMM d, yyyy - hh:mm a') : 'N/A'}
                                                disabled
                                                className="bg-[#1e293b]/50 border-slate-700 text-slate-400 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProcurementList;
