import React, { useState, useEffect } from 'react';
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
import { getShelves, onShelvesChange, onCabinetsChange, onFoldersChange } from '@/lib/storage';
import { Shelf, Cabinet, Folder } from '@/types/procurement';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FolderPlus } from 'lucide-react';

const Cabinets: React.FC = () => {
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [cabinets, setCabinets] = useState<Cabinet[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentShelf, setCurrentShelf] = useState<Shelf | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [cabinetId, setCabinetId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubShelves = onShelvesChange(setShelves);
        const unsubCabinets = onCabinetsChange(setCabinets);
        const unsubFolders = onFoldersChange(setFolders);
        return () => {
            unsubShelves();
            unsubCabinets();
            unsubFolders();
        };
    }, []);

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
        } catch (error) {
            toast.error('Failed to delete cabinet');
        }
    };

    const getShelfName = (id: string) => {
        return cabinets.find(c => c.id === id)?.name || 'Unknown';
    };

    const getFolderCount = (shelfId: string) => {
        return folders.filter(f => f.shelfId === shelfId).length;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Cabinets</h1>
                    <p className="text-slate-400 mt-1">Manage cabinets within shelves (Tier 2)</p>
                </div>
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

            <Card className="border-none bg-[#0f172a] shadow-lg">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-slate-300">Details</TableHead>
                                <TableHead className="text-slate-300">Parent Shelf</TableHead>
                                <TableHead className="text-slate-300">Code</TableHead>
                                <TableHead className="text-slate-300">Folders</TableHead>
                                <TableHead className="text-right text-slate-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shelves.length === 0 ? (
                                <TableRow className="border-slate-800">
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No cabinets found. Add your first cabinet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shelves.map((shelf) => (
                                    <TableRow key={shelf.id} className="border-slate-800 hover:bg-[#1e293b]">
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
                                                                This will permanently delete <strong>{shelf.name}</strong> and all folders inside it.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-transparent border-slate-700 text-white hover:bg-slate-800">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(shelf.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
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