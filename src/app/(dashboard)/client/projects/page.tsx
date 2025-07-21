'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FolderOpen, Search, Calendar, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  brand: {
    id: string;
    name: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionPercentage: number;
    totalTimeHours: number;
  };
}

interface ProjectsData {
  projects: Project[];
}

export default function ClientProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Check if user is CLIENT
        if (user.role !== 'CLIENT') {
          toast.error('Access denied. This page is for clients only.');
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

  // Fetch all projects across all brands
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      
      if (data.success) {
        setProjectsData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      fetchProjects();
    }
  }, [user]);

  // Filter projects based on search and brand filter
  const filteredProjects = projectsData?.projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = brandFilter === 'all' || project.brand.id === brandFilter;
    
    return matchesSearch && matchesBrand;
  }) || [];

  // Get unique brands for filter dropdown
  const brands = projectsData?.projects.reduce((acc, project) => {
    if (!acc.find(b => b.id === project.brand.id)) {
      acc.push(project.brand);
    }
    return acc;
  }, [] as { id: string; name: string; }[]) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
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
                  <h3 className="text-lg font-semibold mb-2">Loading Projects...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we load your projects.
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                All Projects 📁
              </h1>
              <p className="text-gray-600">
                Overview of all your projects across different brands.
              </p>
            </div>
            <Button
              onClick={() => router.push('/client')}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center text-sm text-gray-600">
                <FolderOpen className="w-4 h-4 mr-2" />
                {filteredProjects.length} of {projectsData?.projects.length || 0} projects
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || brandFilter !== 'all' 
                    ? 'No projects match your search criteria.' 
                    : 'No projects available.'}
                </p>
                {(searchTerm || brandFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setBrandFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/client/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-2">{project.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">{project.brand.name}</span>
                      </div>
                      {project.description && (
                        <CardDescription className="text-sm">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className={`text-sm font-bold ${getStatusColor(project.stats.completionPercentage)}`}>
                          {project.stats.completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.stats.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{project.stats.totalTasks}</div>
                        <div className="text-xs text-blue-700">Total Tasks</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{project.stats.completedTasks}</div>
                        <div className="text-xs text-green-700">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{project.stats.totalTimeHours}h</div>
                        <div className="text-xs text-orange-700">Time Spent</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{project.stats.inProgressTasks}</div>
                        <div className="text-xs text-purple-700">In Progress</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Created {formatDate(project.createdAt)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        View Details
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 