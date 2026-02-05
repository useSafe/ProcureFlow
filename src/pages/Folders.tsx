import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { getFolders, getCabinets, getShelves, addFolder, updateFolder, deleteFolder, onFoldersChange, onCabinetsChange, onShelvesChange, onProcurementsChange } from '@/lib/storage';
import { Cabinet, Shelf, Folder, Procurement } from '@/types/procurement';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Folders: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cabinetIdFromUrl = searchParams.get('cabinetId');

    const [folders, setFolders] = useState<Folder[]>([]);
    const [cabinets, setCabinets] = useState<Cabinet[]>([]);
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [procurements, setProcurements] = useState<Procurement[]>([]);

    // UI State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

    // Filter
    const [filterShelf, setFilterShelf] = useState<string>(cabinetIdFromUrl || '');

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    // Form inputs
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [cabinetId, setCabinetId] = useState('');
    const [shelfId, setShelfId] = useState('');
    const [description, setDescription] = useState('');

    // Dynamic filtering
    const [availableShelves, setAvailableShelves] = useState<Shelf[]>([]);

    useEffect(() => {
        const unsubFolders = onFoldersChange(setFolders);
        const unsubCabinets = onCabinetsChange(setCabinets);
        const unsubShelves = onShelvesChange(setShelves);
        const unsubProcurements = onProcurementsChange(setProcurements);

        return () => {
            unsubFolders();
            unsubCabinets();
            unsubShelves();
            unsubProcurements();
        };
    }, []);

    useEffect(() => {
        if (cabinetIdFromUrl) {
            setFilterShelf(cabinetIdFromUrl);
        }
    }, [cabinetIdFromUrl]);

    useEffect(() => {
        if (cabinetId) {
            setAvailableShelves(shelves.filter(s => s.cabinetId === cabinetId));
        } else {
            setAvailableShelves([]);
        }
    }, [cabinetId, shelves]);

    const resetForm = () => {
        setName('');
        setCode('');
        setCabinetId('');
        setShelfId('');
        setDescription('');
        setCurrentFolder(null);
    };

    const handleAdd = async () => {
        if (!name || !code || !cabinetId || !shelfId) {
            toast.error('Name, Code, Cabinet, and Shelf are required');
            return;
        }

        try {
            await addFolder(shelfId, name, code, description);
            setIsAddDialogOpen(false);
            resetForm();
            toast.success('Folder added successfully');
        } catch (error) {
            toast.error('Failed to add folder');
        }
    };

    const handleEditClick = (folder: Folder) => {
        const parentShelf = shelves.find(s => s.id === folder.shelfId);
        const parentCabinetId = parentShelf ? parentShelf.cabinetId : '';

        setCurrentFolder(folder);
        setName(folder.name);
        setCode(folder.code);
        setCabinetId(parentCabinetId);
        setShelfId(folder.shelfId);
        setDescription(folder.description || '');
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentFolder || !name || !code || !shelfId) return;

        try {
            await updateFolder(currentFolder.id, { shelfId, name, code, description });
            setIsEditDialogOpen(false);
            resetForm();
            toast.success('Folder updated successfully');
        } catch (error) {
            toast.error('Failed to update folder');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteFolder(id);
            toast.success('Folder deleted successfully');
            if (selectedIds.includes(id)) {
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            }
        } catch (error) {
            toast.error('Failed to delete folder');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        try {
            await Promise.all(selectedIds.map(id => deleteFolder(id)));
            toast.success(`${selectedIds.length} folders deleted successfully`);
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
        } catch (error) {
            toast.error('Failed to delete some folders');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const currentIds = filteredFolders.map(f => f.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
        } else {
            const currentIds = filteredFolders.map(f => f.id);
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

    const handleViewFiles = (folderId: string) => {
    // Change this to match your actual route path
    navigate(`/procurement-list?folderId=${folderId}`);
    // OR whatever your actual route is:
    // navigate(`/your-actual-route?folderId=${folderId}`);
};

    const getShelfName = (id: string) => {
        return shelves.find(s => s.id === id)?.name || 'Unknown Shelf';
    };

    const getFileCount = (folderId: string) => {
        return procurements.filter(p => p.folderId === folderId).length;
    };

    const filteredFolders = folders.filter(folder => {
        if (!filterShelf || filterShelf === 'all') return true;
        return folder.shelfId === filterShelf;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Folders</h1>
                    <p className="text-slate-400 mt-1">Manage folders within shelves (Tier 3)</p>
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
                                    <AlertDialogTitle>Delete {selectedIds.length} Folders?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        This action cannot be undone. This will permanently delete the selected folders.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete All</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" /> Add Folder
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0f172a] border-slate-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Folder</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Create a new folder inside a shelf.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-slate-300">Cabinet</Label>
                                    <Select value={cabinetId} onValueChange={setCabinetId}>
                                        <SelectTrigger className="col-span-3 bg-[#1e293b] border-slate-700 text-white">
                                            <SelectValue placeholder="Select Cabinet" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            {cabinets.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-slate-300">Shelf</Label>
                                    <Select value={shelfId} onValueChange={setShelfId} disabled={!cabinetId}>
                                        <SelectTrigger className="col-span-3 bg-[#1e293b] border-slate-700 text-white">
                                            <SelectValue placeholder="Select Shelf" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                            {availableShelves.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right text-slate-300">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                                        placeholder="Project Documents"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="code" className="text-right text-slate-300">Code</Label>
                                    <Input
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                                        placeholder="F1"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="desc" className="text-right text-slate-300">Description</Label>
                                    <Textarea
                                        id="desc"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">Cancel</Button>
                                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Save Folder</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter */}
            <Card className="border-none bg-[#0f172a] shadow-lg">
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                        <Label className="text-slate-300 whitespace-nowrap">Filter by Shelf:</Label>
                        <Select value={filterShelf} onValueChange={setFilterShelf}>
                            <SelectTrigger className="w-[200px] bg-[#1e293b] border-slate-700 text-white">
                                <SelectValue placeholder="All Shelves" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                <SelectItem value="all">All Shelves</SelectItem>
                                {shelves.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-[#0f172a] shadow-lg">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={filteredFolders.length > 0 && filteredFolders.every(f => selectedIds.includes(f.id))}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableHead>
                                <TableHead className="text-slate-300">Details</TableHead>
                                <TableHead className="text-slate-300">Parent Shelf</TableHead>
                                <TableHead className="text-slate-300">Code</TableHead>
                                <TableHead className="text-slate-300">Files</TableHead>
                                <TableHead className="text-right text-slate-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFolders.length === 0 ? (
                                <TableRow className="border-slate-800">
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No folders found. Add your first folder.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFolders.map((folder) => (
                                    <TableRow key={folder.id} className="border-slate-800 hover:bg-[#1e293b]">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(folder.id)}
                                                onCheckedChange={(checked) => handleSelectOne(folder.id, checked as boolean)}
                                                className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{folder.name}</p>
                                                    <p className="text-xs text-slate-400">{folder.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {getShelfName(folder.shelfId)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                                {folder.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {getFileCount(folder.id)} files
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewFiles(folder.id)}
                                                    className="h-8 bg-emerald-600/10 border-emerald-600/20 text-emerald-500 hover:bg-emerald-600/20 hover:text-emerald-400"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Files
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(folder)}
                                                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-[#1e293b] border-slate-800 text-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-400">
                                                                {getFileCount(folder.id) > 0 ? (
                                                                    <div className="text-red-400 font-medium border border-red-400/20 bg-red-400/10 p-3 rounded-md">
                                                                        Cannot delete this folder.<br />
                                                                        It contains:<br />
                                                                        <ul className="list-disc list-inside mt-1 ml-2">
                                                                            <li><strong>{getFileCount(folder.id)}</strong> File{getFileCount(folder.id) !== 1 ? 's' : ''}</li>
                                                                        </ul>
                                                                        <br />
                                                                        Please delete or move all contents first.
                                                                    </div>
                                                                ) : (
                                                                    <span>This will permanently delete <strong>{folder.name}</strong>.</span>
                                                                )}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(folder.id)}
                                                                disabled={getFileCount(folder.id) > 0}
                                                                className={getFileCount(folder.id) > 0
                                                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed hover:bg-slate-700"
                                                                    : "bg-red-600 hover:bg-red-700 text-white"}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-[#0f172a] border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit Folder</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-slate-300">Cabinet</Label>
                            <Select value={cabinetId} onValueChange={setCabinetId}>
                                <SelectTrigger className="col-span-3 bg-[#1e293b] border-slate-700 text-white">
                                    <SelectValue placeholder="Select Cabinet" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                    {cabinets.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-slate-300">Shelf</Label>
                            <Select value={shelfId} onValueChange={setShelfId} disabled={!cabinetId}>
                                <SelectTrigger className="col-span-3 bg-[#1e293b] border-slate-700 text-white">
                                    <SelectValue placeholder="Select Shelf" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                    {availableShelves.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right text-slate-300">Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-code" className="text-right text-slate-300">Code</Label>
                            <Input
                                id="edit-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-desc" className="text-right text-slate-300">Description</Label>
                            <Textarea
                                id="edit-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">Cancel</Button>
                        <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Folders;