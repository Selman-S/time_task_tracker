import { useAuthStore } from '@/stores/authStore';

// Check if user can create brands
export const canCreateBrand = (userRole: string): boolean => {
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
};

// Check if user can create projects (for a specific brand)
export const canCreateProject = (userRole: string): boolean => {
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER';
};

// Check if user can create tasks (for a specific project)
export const canCreateTask = (userRole: string): boolean => {
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER';
};

// Get current user role
export const getUserRole = (): string => {
  const { user } = useAuthStore.getState();
  return user?.role || '';
};

// Check if user has write permissions for a brand
export const hasBrandWritePermission = async (brandId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands/${brandId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.success && ['WRITE', 'ADMIN'].includes(data.data?.permissionLevel);
    }
  } catch (error) {
    console.error('Error checking brand permissions:', error);
  }
  return false;
};

// Check if user has write permissions for a project
export const hasProjectWritePermission = async (projectId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.success && ['WRITE', 'ADMIN'].includes(data.data?.permissionLevel);
    }
  } catch (error) {
    console.error('Error checking project permissions:', error);
  }
  return false;
}; 