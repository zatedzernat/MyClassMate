import { Role } from "@/util/role-enum";
import { ImportResponse, UserRequest, UserResponse } from "./data/user-response";

export async function getUsers(selectedRole: Role): Promise<UserResponse[]> {
    const role = localStorage.getItem("user-role") || "";

    const url = new URL('http://127.0.0.1:8080/my-class-mate/v1/users');
    
    // Only add role parameter if it's not "all" or empty
    if (selectedRole && selectedRole.toLowerCase() !== 'all') {
        url.searchParams.append('role', selectedRole);
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-role': role
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }

    // Assuming API returns an array of users
    const mappedUsers: UserResponse[] = resData.map((user: any) => ({
        userId: user.userId,
        username: user.username,
        password: user.password,
        nameTh: user.nameTh,
        surnameTh: user.surnameTh,
        nameEn: user.nameEn,
        surnameEn: user.surnameEn,
        email: user.email,
        role: user.role,
        isDeleted: user.isDeleted,
        studentProfile: user.studentProfile
    }));

    return mappedUsers;
}

export async function getUser(userId: string): Promise<UserResponse> {
    const role = localStorage.getItem("user-role") || "";

    const response = await fetch(`http://127.0.0.1:8080/my-class-mate/v1/users/${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-role': role
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }

    // Map the API response to UserResponse object
    const mappedUser: UserResponse = {
        userId: resData.userId,
        username: resData.username,
        password: resData.password,
        nameTh: resData.nameTh,
        surnameTh: resData.surnameTh,
        nameEn: resData.nameEn,
        surnameEn: resData.surnameEn,
        email: resData.email,
        role: resData.role,
        isDeleted: resData.isDeleted,
        studentProfile: resData.studentProfile,
        isUploadedImage: resData.isUploadedImage,
        imageCount: resData.imageCount
    };

    console.log('Fetched user:', mappedUser); // Debug log

    return mappedUser;
}

export async function createUser(userRequest: UserRequest): Promise<void> {
    const role = localStorage.getItem("user-role") || "";

    const response = await fetch('/api/my-class-mate/v1/users', {
        method: 'POST',
        body: JSON.stringify(userRequest),
        headers: {
            'Content-Type': 'application/json',
            'x-role': role
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }
}

export async function updateUser(userRequest: UserRequest): Promise<void> {
    if (!userRequest.userId) throw new Error("userId is required for update");

    const role = localStorage.getItem("user-role") || "";

    const response = await fetch(`/api/my-class-mate/v1/users/${encodeURIComponent(userRequest.userId)}`, {
        method: 'PUT',
        body: JSON.stringify(userRequest),
        headers: {
            'Content-Type': 'application/json',
            'x-role': role
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }
}

export async function deleteUser(userRequest: Pick<UserRequest, 'userId'>): Promise<void> {
    if (!userRequest.userId) throw new Error("userId is required for delete");

    const role = localStorage.getItem("user-role") || "";

    const response = await fetch(`/api/my-class-mate/v1/users/${encodeURIComponent(userRequest.userId)}`, {
        method: 'DELETE',
        body: JSON.stringify(userRequest),
        headers: {
            'Content-Type': 'application/json',
            'x-role': role
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }
}

export async function importUsers(file: File): Promise<ImportResponse> {
    const role = localStorage.getItem("user-role") || "";

    const formData = new FormData();
    formData.append("file", file); // field name is 'file'

    const response = await fetch('/api/my-class-mate/v1/users/import', {
        method: 'POST',
        body: formData,
        headers: {
            'x-role': role
            // Note: do NOT set Content-Type, the browser will set multipart/form-data automatically
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }

    return { updatedRow: resData.updatedRow, createdRow: resData.createdRow }

}

export async function exportUsers(selectedRole?: Role): Promise<void> {
    const role = localStorage.getItem("user-role") || "";
    
    const url = new URL('/api/my-class-mate/v1/users/export', window.location.origin);
    
    // Add role parameter if provided and not "all"
    if (selectedRole && selectedRole.toLowerCase() !== 'all') {
        url.searchParams.append('role', selectedRole);
    }
  
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-role": role,
      },
    });
  
    if (!response.ok) {
      const resData = await response.json().catch(() => ({}));
      const errorMessage = resData?.message || resData?.code || "Unknown error occurred";
      throw new Error(errorMessage);
    }
  
    // Get the file blob
    const blob = await response.blob();
  
    // Create a link and trigger download
    const url_obj = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url_obj;
  
    // File name: try backend Content-Disposition, fallback to default with role
    const contentDisposition = response.headers.get("Content-Disposition");
    let fileName = selectedRole && selectedRole.toLowerCase() !== 'all' 
        ? `users_${selectedRole.toLowerCase()}_export.xlsx`
        : "users_export.xlsx";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match?.[1]) fileName = match[1];
    }
  
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
  
    // Cleanup
    a.remove();
    window.URL.revokeObjectURL(url_obj);
}

export async function downloadUserTemplate(): Promise<void> {
    const role = localStorage.getItem("user-role") || "";
    
    const url = new URL('/api/my-class-mate/v1/users/export', window.location.origin);
    url.searchParams.append('isTemplate', 'true');
  
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-role": role,
      },
    });
  
    if (!response.ok) {
      const resData = await response.json().catch(() => ({}));
      const errorMessage = resData?.message || resData?.code || "Unknown error occurred";
      throw new Error(errorMessage);
    }
  
    // Get the file blob
    const blob = await response.blob();
  
    // Create a link and trigger download
    const url_obj = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url_obj;
  
    // File name: template file
    const contentDisposition = response.headers.get("Content-Disposition");
    let fileName = "user_import_template.xlsx";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match?.[1]) fileName = match[1];
    }
  
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
  
    // Cleanup
    a.remove();
    window.URL.revokeObjectURL(url_obj);
}
  
