
export interface LoginRequest {
    username: string;
    password: string;
  }
  
  export interface LoginResponse {
    userId: string;
    username: string;
    nameTh: string;
    surnameTh: string;
    email: string;
    role: string;
  }

export async function login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/my-class-mate/v1/users/login',{
        method: 'POST',
        body: JSON.stringify(loginRequest),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const resData = await response.json();

    if (!response.ok){
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage)
    }

    // map API response to object we want in state
    const mappedUser: LoginResponse = {
      userId: resData.userId,
      username: resData.username,
      nameTh: resData.nameTh,
      surnameTh: resData.surnameTh,
      email: resData.email,
      role: resData.role,
    };

    return mappedUser
}

// ทุก function ใน  class นี้ เมื่อเอาไปใช้ให้ ครอบใน try catch เนื่องจากมี throw error