'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FolderOpen, CheckCircle, Clock, Users, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    totalTimeHours: number;
  };
}

interface Brand {
  id: string;
  name: string;
  description?: string;
  permissionLevel: string;
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    totalTimeHours: number;
  };
  projects: Project[];
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  brands: Brand[];
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('30days');

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

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/dashboard?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data when user or dateRange changes
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case '90days': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Dashboard...</h3>
              <p className="text-muted-foreground">
                Please wait while we load your projects and statistics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                No brands found for your account. Please contact your administrator to assign brand access.
              </p>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Go to Main Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalStats = dashboardData.brands.reduce(
    (acc, brand) => ({
      totalProjects: acc.totalProjects + brand.stats.totalProjects,
      totalTasks: acc.totalTasks + brand.stats.totalTasks,
      completedTasks: acc.completedTasks + brand.stats.completedTasks,
      totalTimeHours: acc.totalTimeHours + brand.stats.totalTimeHours,
    }),
    { totalProjects: 0, totalTasks: 0, completedTasks: 0, totalTimeHours: 0 }
  );

  const overallCompletionPercentage = totalStats.totalTasks > 0 
    ? Math.round((totalStats.completedTasks / totalStats.totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {dashboardData.user.name}!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your projects and their progress.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {getDateRangeLabel(dateRange)}
          </Badge>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalProjects}</p>
                <p className="text-sm text-blue-700">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.completedTasks}</p>
                <p className="text-sm text-green-700">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{overallCompletionPercentage}%</p>
                <p className="text-sm text-purple-700">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalTimeHours}h</p>
                <p className="text-sm text-orange-700">Time Invested</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands Overview */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Your Brands</h3>
        <div className="grid gap-6">
          {dashboardData.brands.map((brand) => (
            <Card key={brand.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span>{brand.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {brand.permissionLevel}
                      </Badge>
                    </CardTitle>
                    {brand.description && (
                      <CardDescription className="mt-2">
                        {brand.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => router.push(`/client/brands/${brand.id}/projects`)}
                      variant="outline"
                      size="sm"
                    >
                      View Projects <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      onClick={() => router.push(`/client/brands/${brand.id}/reports`)}
                      variant="outline"
                      size="sm"
                    >
                      View Reports
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Brand Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{brand.stats.totalProjects}</div>
                    <div className="text-sm text-blue-700">Projects</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{brand.stats.completionPercentage}%</div>
                    <div className="text-sm text-green-700">Complete</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{brand.stats.totalTasks}</div>
                    <div className="text-sm text-purple-700">Total Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{brand.stats.totalTimeHours}h</div>
                    <div className="text-sm text-orange-700">Time Spent</div>
                  </div>
                </div>

                {/* Recent Projects */}
                {brand.projects.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Projects</h4>
                    <div className="grid gap-3">
                      {brand.projects.slice(0, 3).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => router.push(`/client/projects/${project.id}`)}
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{project.name}</h5>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">
                                {project.stats.completionPercentage}%
                              </div>
                              <div className="text-xs text-gray-500">Complete</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {project.stats.totalTimeHours}h
                              </div>
                              <div className="text-xs text-gray-500">Time</div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {brand.projects.length > 3 && (
                      <div className="mt-3 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/client/brands/${brand.id}/projects`)}
                        >
                          View All {brand.projects.length} Projects
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 