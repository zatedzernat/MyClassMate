import { Role } from "@/util/role-enum";

export interface UserRequest {
    userId?: string;
    username: string;
    password: string;
    nameTh: string;
    surnameTh: string;
    nameEn: string;
    surnameEn: string;
    email: string;
    role: Role;
    isDeleted?: boolean;
    studentNo?: string;
  }
  
  export interface UserResponse extends UserRequest {}
  
  export async function getUsers(selectedRole: Role): Promise<UserResponse[]> {
    const role = localStorage.getItem("user-role") || "";

    const url = new URL('http://127.0.0.1:8080/my-class-mate/v1/users');
    if (selectedRole) {
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
      studentNo: user.studentNo,
    }));
  
    return mappedUsers;
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
  
  // Note: Wrap all function calls in try/catch when using, because they throw errors
  