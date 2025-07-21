'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  FileText, 
  DollarSign,
  CheckCircle2,
  Filter,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface TimeEntry {
  id: string;
  workDate: string;
  durationMinutes: number;
  notes?: string;
  user: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    project: {
      id: string;
      name: string;
    };
  };
  hourlyRate?: number;
}

interface GenerationSummary {
  totalHours: number;
  totalAmount: number;
  entriesCount: number;
  usersCount: number;
  projectsCount: number;
}

export default function GenerateInvoicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    brandId: '',
    clientUserId: '',
    periodStart: '',
    periodEnd: '',
    title: '',
    description: '',
  });

  // Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  // Load user and check permissions
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
          toast.error('Access denied. Admin access required.');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch initial data
  useEffect(() => {
    if (user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch brands and clients
      const [brandsRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?role=CLIENT`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [brandsData, clientsData] = await Promise.all([
        brandsRes.json(),
        clientsRes.json(),
      ]);

      if (brandsData.success) setBrands(brandsData.data.brands || []);
      if (clientsData.success) setClients(clientsData.data.users || []);

      // Set default dates (current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setFormData(prev => ({
        ...prev,
        periodStart: firstDay.toISOString().split('T')[0],
        periodEnd: lastDay.toISOString().split('T')[0],
        title: `Invoice for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      }));
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch time entries when brand and dates are selected
  useEffect(() => {
    if (formData.brandId && formData.periodStart && formData.periodEnd) {
      fetchTimeEntries();
    }
  }, [formData.brandId, formData.periodStart, formData.periodEnd]);

  const fetchTimeEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Mock time entries for now (replace with real API call)
      const mockTimeEntries: TimeEntry[] = [
        {
          id: '1',
          workDate: '2024-07-15',
          durationMinutes: 480, // 8 hours
          notes: 'Frontend development work',
          user: { id: '1', name: 'John Doe' },
          task: { 
            id: '1', 
            title: 'Homepage Design',
            project: { id: '1', name: 'Website Development' }
          },
          hourlyRate: 250,
        },
        {
          id: '2',
          workDate: '2024-07-16',
          durationMinutes: 360, // 6 hours
          notes: 'Backend API development',
          user: { id: '2', name: 'Jane Smith' },
          task: { 
            id: '2', 
            title: 'User Authentication',
            project: { id: '1', name: 'Website Development' }
          },
          hourlyRate: 300,
        },
        {
          id: '3',
          workDate: '2024-07-17',
          durationMinutes: 240, // 4 hours
          notes: 'Database optimization',
          user: { id: '2', name: 'Jane Smith' },
          task: { 
            id: '3', 
            title: 'Performance Optimization',
            project: { id: '2', name: 'System Optimization' }
          },
          hourlyRate: 300,
        },
      ];

      setTimeEntries(mockTimeEntries);
      // Auto-select all entries initially
      setSelectedEntries(new Set(mockTimeEntries.map(entry => entry.id)));
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load time entries');
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle time entry selection
  const toggleTimeEntry = (entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleAllEntries = () => {
    if (selectedEntries.size === timeEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(timeEntries.map(entry => entry.id)));
    }
  };

  // Calculate generation summary
  const summary: GenerationSummary = {
    totalHours: timeEntries
      .filter(entry => selectedEntries.has(entry.id))
      .reduce((sum, entry) => sum + (entry.durationMinutes / 60), 0),
    totalAmount: timeEntries
      .filter(entry => selectedEntries.has(entry.id))
      .reduce((sum, entry) => sum + ((entry.durationMinutes / 60) * (entry.hourlyRate || 0)), 0),
    entriesCount: selectedEntries.size,
    usersCount: new Set(timeEntries
      .filter(entry => selectedEntries.has(entry.id))
      .map(entry => entry.user.id)).size,
    projectsCount: new Set(timeEntries
      .filter(entry => selectedEntries.has(entry.id))
      .map(entry => entry.task.project.id)).size,
  };

  // Generate invoice
  const handleGenerate = async () => {
    try {
      if (!formData.brandId || !formData.clientUserId || !formData.title) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (selectedEntries.size === 0) {
        toast.error('Please select at least one time entry');
        return;
      }

      setGenerating(true);
      const token = localStorage.getItem('token');

      const payload = {
        brandId: formData.brandId,
        clientUserId: formData.clientUserId,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        title: formData.title,
        description: formData.description,
        timeEntryIds: Array.from(selectedEntries),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Invoice generated successfully from time entries');
        router.push('/admin/invoices');
      } else {
        throw new Error(data.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Loading Generator...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we prepare the invoice generator.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/admin/invoices')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Generate Invoice from Time Entries ⚡
            </h1>
            <p className="text-gray-600">
              Automatically create invoices from tracked time entries.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Generation Settings
                </CardTitle>
                <CardDescription>
                  Configure the invoice generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandId">Brand *</Label>
                    <Select value={formData.brandId} onValueChange={(value) => handleInputChange('brandId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="clientUserId">Client *</Label>
                    <Select value={formData.clientUserId} onValueChange={(value) => handleInputChange('clientUserId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="periodStart">Period Start *</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => handleInputChange('periodStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End *</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Invoice Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter invoice title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Invoice description (optional)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time Entries */}
            {timeEntries.length > 0 && (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Time Entries ({timeEntries.length})
                      </CardTitle>
                      <CardDescription>
                        Select time entries to include in the invoice
                      </CardDescription>
                    </div>
                    <Button
                      onClick={toggleAllEntries}
                      variant="outline"
                      size="sm"
                    >
                      {selectedEntries.size === timeEntries.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedEntries.has(entry.id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedEntries.has(entry.id)}
                            onCheckedChange={() => toggleTimeEntry(entry.id)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{entry.task.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {entry.task.project.name}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {entry.user.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(entry.workDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatHours(entry.durationMinutes)}
                              </span>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency((entry.durationMinutes / 60) * (entry.hourlyRate || 0))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(entry.hourlyRate || 0)}/hour
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Generation Summary */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Generation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Selected Entries:</span>
                    <span className="font-medium">{summary.entriesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Hours:</span>
                    <span className="font-medium">{summary.totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Users:</span>
                    <span className="font-medium">{summary.usersCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects:</span>
                    <span className="font-medium">{summary.projectsCount}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(summary.totalAmount)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || selectedEntries.size === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate Invoice'}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-2xl bg-green-50/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-900 mb-2">Automatic Generation</h3>
                  <p className="text-sm text-green-700">
                    Select time entries and generate invoices automatically with calculated rates and totals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 