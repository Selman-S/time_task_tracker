import { toast } from "@/hooks/use-toast"

// Success toast
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    variant: "success",
    title: `✅ ${title}`,
    description,
    duration: 4000,
  })
}

// Error toast
export const showErrorToast = (title: string, description?: string) => {
  toast({
    variant: "destructive",
    title: `❌ ${title}`,
    description,
    duration: 6000,
  })
}

// Warning toast
export const showWarningToast = (title: string, description?: string) => {
  toast({
    variant: "warning",
    title: `⚠️ ${title}`,
    description,
    duration: 5000,
  })
}

// Info toast
export const showInfoToast = (title: string, description?: string) => {
  toast({
    variant: "info",
    title: `ℹ️ ${title}`,
    description,
    duration: 4000,
  })
}

// CRUD operation toasts
export const showCreateSuccessToast = (itemName: string) => {
  showSuccessToast(
    `${itemName} Created Successfully`,
    `The ${itemName.toLowerCase()} has been created and is now available.`
  )
}

export const showUpdateSuccessToast = (itemName: string) => {
  showSuccessToast(
    `${itemName} Updated Successfully`,
    `The ${itemName.toLowerCase()} has been updated with the new information.`
  )
}

export const showDeleteSuccessToast = (itemName: string) => {
  showSuccessToast(
    `${itemName} Deleted Successfully`,
    `The ${itemName.toLowerCase()} has been permanently removed.`
  )
}

export const showCreateErrorToast = (itemName: string, error?: string) => {
  showErrorToast(
    `Failed to Create ${itemName}`,
    error || `An error occurred while creating the ${itemName.toLowerCase()}. Please try again.`
  )
}

export const showUpdateErrorToast = (itemName: string, error?: string) => {
  showErrorToast(
    `Failed to Update ${itemName}`,
    error || `An error occurred while updating the ${itemName.toLowerCase()}. Please try again.`
  )
}

export const showDeleteErrorToast = (itemName: string, error?: string) => {
  showErrorToast(
    `Failed to Delete ${itemName}`,
    error || `An error occurred while deleting the ${itemName.toLowerCase()}. Please try again.`
  )
}

// Time tracking specific toasts
export const showTimerStartedToast = () => {
  showSuccessToast(
    "Timer Started Successfully",
    "Your time tracking session has begun. The timer is now running."
  )
}

export const showTimerStoppedToast = () => {
  showSuccessToast(
    "Timer Stopped Successfully",
    "Your time tracking session has ended. The time entry has been saved."
  )
}

export const showTimeEntryCreatedToast = () => {
  showSuccessToast(
    "Time Entry Created Successfully",
    "Your manual time entry has been saved to the system."
  )
}

export const showTimeEntryErrorToast = (error?: string) => {
  showErrorToast(
    "Time Entry Error",
    error || "An error occurred while processing your time entry. Please try again."
  )
}

// Authentication toasts
export const showLoginSuccessToast = (userName: string) => {
  showSuccessToast(
    "Welcome Back!",
    `Hello ${userName}, you have been successfully logged in.`
  )
}

export const showLoginErrorToast = (error?: string) => {
  showErrorToast(
    "Login Failed",
    error || "Invalid email or password. Please check your credentials and try again."
  )
}

export const showLogoutSuccessToast = () => {
  showInfoToast(
    "Logged Out Successfully",
    "You have been logged out of your account. Come back soon!"
  )
}

// Permission toasts
export const showPermissionDeniedToast = () => {
  showWarningToast(
    "Access Denied",
    "You don't have permission to perform this action. Please contact your administrator."
  )
}

// Network error toast
export const showNetworkErrorToast = () => {
  showErrorToast(
    "Network Error",
    "Unable to connect to the server. Please check your internet connection and try again."
  )
}

// Generic error handler
export const handleApiError = (error: any, operation: string, itemName: string) => {
  console.error(`${operation} error:`, error)
  
  let errorMessage = "An unexpected error occurred."
  
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (error?.message) {
    errorMessage = error.message
  }
  
  switch (operation.toLowerCase()) {
    case 'create':
      showCreateErrorToast(itemName, errorMessage)
      break
    case 'update':
      showUpdateErrorToast(itemName, errorMessage)
      break
    case 'delete':
      showDeleteErrorToast(itemName, errorMessage)
      break
    default:
      showErrorToast(`${operation} Failed`, errorMessage)
  }
} 