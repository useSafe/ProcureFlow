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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getShelves, onShelvesChange, onCabinetsChange, onFoldersChange, onProcurementsChange } from '@/lib/storage';
import { Shelf, Cabinet, Folder, Procurement } from '@/types/procurement';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FolderPlus, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Cabinets: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const shelfIdFromUrl = searchParams.get('shelfId');

    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [cabinets, setCabinets] = useState<Cabinet[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [procurements, setProcurements] = useState<Procurement[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentShelf, setCurrentShelf] = useState<Shelf | null>(null);

    // Filter
    const [filterCabinet, setFilterCabinet] = useState<string>(shelfIdFromUrl || '');

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [cabinetId, setCabinetId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        const unsubShelves = onShelvesChange(setShelves);
        const unsubCabinets = onCabinetsChange(setCabinets);
        const unsubFolders = onFoldersChange(setFolders);
        const unsubProcurements = onProcurementsChange(setProcurements);
        return () => {
            unsubShelves();
            unsubCabinets();
            unsubFolders();
            unsubProcurements();
        };
    }, []);

    useEffect(() => {
        if (shelfIdFromUrl) {
            setFilterCabinet(shelfIdFromUrl);
        }
    }, [shelfIdFromUrl]);

    const resetForm = () => {
        setName('');
        setCode('');
        setCabinetId('');
        setDescription('');
        setCurrentShelf(null);
    };

    const handleAdd = async () => {
        if (!name || !code || !cabinetId) {
            toast.error('Name, Code, and Shelf are required');
            return;
        }

        try {
            const { addShelf } = await import('@/lib/storage');
            await addShelf(cabinetId, name, code, description);
            setIsAddDialogOpen(false);
            resetForm();
            toast.success('Cabinet added successfully');
        } catch (error) {
            toast.error('Failed to add cabinet');
        }
    };

    const handleEditClick = (shelf: Shelf) => {
        setCurrentShelf(shelf);
        setName(shelf.name);
        setCode(shelf.code);
        setCabinetId(shelf.cabinetId);
        setDescription(shelf.description || '');
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!currentShelf || !name || !code || !cabinetId) return;

        try {
            const { updateShelf } = await import('@/lib/storage');
            await updateShelf(currentShelf.id, { cabinetId, name, code, description });
            setIsEditDialogOpen(false);
            resetForm();
            toast.success('Cabinet updated successfully');
        } catch (error) {
            toast.error('Failed to update cabinet');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { deleteShelf } = await import('@/lib/storage');
            await deleteShelf(id);
            toast.success('Cabinet deleted successfully');
            if (selectedIds.includes(id)) {
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            }
        } catch (error) {
            toast.error('Failed to delete cabinet');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        try {
            const { deleteShelf } = await import('@/lib/storage');
            await Promise.all(selectedIds.map(id => deleteShelf(id)));
            toast.success(`${selectedIds.length} cabinets deleted successfully`);
            setSelectedIds([]);
            setIsBulkDeleteDialogOpen(false);
        } catch (error) {
            toast.error('Failed to delete some cabinets');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const currentIds = filteredShelves.map(s => s.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
        } else {
            const currentIds = filteredShelves.map(s => s.id);
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

    const handleViewFolders = (shelfId: string) => {
        navigate(`/folders?cabinetId=${shelfId}`);
    };

    const getShelfName = (id: string) => {
        return cabinets.find(c => c.id === id)?.name || 'Unknown';
    };

    const getFolderCount = (shelfId: string) => {
        return folders.filter(f => f.shelfId === shelfId).length;
    };

    const getHierarchyCounts = (shelfId: string) => {
        const myFolders = folders.filter(f => f.shelfId === shelfId);
        const myFolderIds = myFolders.map(f => f.id);
        const myFiles = procurements.filter(p => myFolderIds.includes(p.folderId));

        return {
            folders: myFolders.length,
            files: myFiles.length
        };
    };

    const filteredShelves = shelves.filter(shelf => {
        if (!filterCabinet || filterCabinet === 'all') return true;
        return shelf.cabinetId === filterCabinet;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Cabinets</h1>
                    <p className="text-slate-400 mt-1">Manage cabinets within shelves (Tier 2)</p>
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
                                    <AlertDialogTitle>Delete {selectedIds.length} Cabinets?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        This action cannot be undone. This will permanently delete the selected cabinets.
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
                                <Plus className="mr-2 h-4 w-4" /> Add Cabinet
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0f172a] border-slate-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Cabinet</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Create a new cabinet inside a shelf.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-slate-300">Parent Shelf</Label>
                                    <select
                                        value={cabinetId}
                                        onChange={(e) => setCabinetId(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white rounded-md p-2"
                                    >
                                        <option value="">Select Shelf</option>
                                        {cabinets.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right text-slate-300">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                                        placeholder="Cabinet 1"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="code" className="text-right text-slate-300">
                                        Code
                                    </Label>
                                    <Input
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                                        placeholder="C1"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="desc" className="text-right text-slate-300">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="desc"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                                        placeholder="Description..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">Cancel</Button>
                                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Save Cabinet</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter */}
            <Card className="border-none bg-[#0f172a] shadow-lg">
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                        <Label className="text-slate-300 whitespace-nowrap">Filter by Shelves:</Label>
                        <Select value={filterCabinet} onValueChange={setFilterCabinet}>
                            <SelectTrigger className="w-[200px] bg-[#1e293b] border-slate-700 text-white">
                                <SelectValue placeholder="All Shelves" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                                <SelectItem value="all">All Shelves</SelectItem>
                                {cabinets.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
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
                                        checked={filteredShelves.length > 0 && filteredShelves.every(s => selectedIds.includes(s.id))}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableHead>
                                <TableHead className="text-slate-300">Details</TableHead>
                                <TableHead className="text-slate-300">Parent Shelf</TableHead>
                                <TableHead className="text-slate-300">Code</TableHead>
                                <TableHead className="text-slate-300">Folders</TableHead>
                                <TableHead className="text-right text-slate-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredShelves.length === 0 ? (
                                <TableRow className="border-slate-800">
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No cabinets found. Add your first cabinet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredShelves.map((shelf) => (
                                    <TableRow key={shelf.id} className="border-slate-800 hover:bg-[#1e293b]">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(shelf.id)}
                                                onCheckedChange={(checked) => handleSelectOne(shelf.id, checked as boolean)}
                                                className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <FolderPlus className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{shelf.name}</p>
                                                    <p className="text-xs text-slate-400">{shelf.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {getShelfName(shelf.cabinetId)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                                {shelf.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {getFolderCount(shelf.id)} folders
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewFolders(shelf.id)}
                                                    className="h-8 bg-emerald-600/10 border-emerald-600/20 text-emerald-500 hover:bg-emerald-600/20 hover:text-emerald-400"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Folders
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(shelf)}
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
                                                            <AlertDialogTitle>Delete Cabinet?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-400">
                                                                {(() => {
                                                                    const counts = getHierarchyCounts(shelf.id);
                                                                    const hasContents = counts.folders > 0 || counts.files > 0;

                                                                    if (hasContents) {
                                                                        return (
                                                                            <div className="text-red-400 font-medium border border-red-400/20 bg-red-400/10 p-3 rounded-md">
                                                                                Cannot delete this cabinet.<br />
                                                                                It contains:<br />
                                                                                <ul className="list-disc list-inside mt-1 ml-2">
                                                                                    {counts.folders > 0 && <li><strong>{counts.folders}</strong> Folder{counts.folders !== 1 ? 's' : ''}</li>}
                                                                                    {counts.files > 0 && <li><strong>{counts.files}</strong> File{counts.files !== 1 ? 's' : ''}</li>}
                                                                                </ul>
                                                                                <br />
                                                                                Please delete all contents first.
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return <span>This will permanently delete <strong>{shelf.name}</strong> and all folders inside it.</span>;
                                                                })()}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(shelf.id)}
                                                                disabled={(() => {
                                                                    const c = getHierarchyCounts(shelf.id);
                                                                    return c.folders > 0 || c.files > 0;
                                                                })()}
                                                                className={(() => {
                                                                    const c = getHierarchyCounts(shelf.id);
                                                                    return (c.folders > 0 || c.files > 0)
                                                                        ? "bg-slate-700 text-slate-400 cursor-not-allowed hover:bg-slate-700"
                                                                        : "bg-red-600 hover:bg-red-700 text-white";
                                                                })()}
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
                        <DialogTitle>Edit Cabinet</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-slate-300">Parent Shelf</Label>
                            <select
                                value={cabinetId}
                                onChange={(e) => setCabinetId(e.target.value)}
                                className="col-span-3 bg-[#1e293b] border-slate-700 text-white rounded-md p-2"
                            >
                                <option value="">Select Shelf</option>
                                {cabinets.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right text-slate-300">
                                Name
                            </Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-code" className="text-right text-slate-300">
                                Code
                            </Label>
                            <Input
                                id="edit-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="col-span-3 bg-[#1e293b] border-slate-700 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-desc" className="text-right text-slate-300">
                                Description
                            </Label>
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

export default Cabinets;