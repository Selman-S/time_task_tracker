export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandPermission {
  id: string;
  permissionLevel: string;
  brand: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface ProjectPermission {
  id: string;
  permissionLevel: string;
  project: {
    id: string;
    name: string;
    description?: string;
    brand: {
      id: string;
      name: string;
    };
  };
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  brand: {
    id: string;
    name: string;
  };
}

export interface UserNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Activity {
  id: string;
  type: 'time_entry' | 'task_assigned' | 'task_created';
  title: string;
  description: string;
  timestamp: string;
  data: any;
}

export interface UserDetails {
  user: User;
  brandPermissions: BrandPermission[];
  projectPermissions: ProjectPermission[];
  availableBrands: Brand[];
  availableProjects: Project[];
} 