
// example
export async function fetchTest() {
    const response = await fetch('https://localhost:test/test')
    const resData = await response.json();

    if (!response.ok){
        throw new Error('Failed to fetch places')
    }

    return resData
}


export async function login(loginRequest) {
    const response = await fetch('https://localhost:test/login',{
        method: 'POST',
        body: JSON.stringify(loginRequest),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const resData = await response.json();

    if (!response.ok){
        const errorMessage = resData?.message || resData?.error || 'Unknown error occurred';
        throw new Error(errorMessage)
    }

    // map API response to object we want in state
    const mappedUser = {
        userId: resData.userId,
        name: resData.name,
        role: resData.role,
      };

    return mappedUser
}

export async function logout() {
    const response = await fetch('https://localhost:test/logout',{
        method: 'POST',
        // body: JSON.stringify(request),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const resData = await response.json();

    if (!response.ok){
        const errorMessage = resData?.message || resData?.error || 'Unknown error occurred';
        throw new Error(errorMessage)
    }

    // map API response to object we want in state
    const mappedUser = {
        userId: resData.userId,
        name: resData.name,
        role: resData.role,
      };

    return mappedUser
}

// ทุก function ใน  class นี้ เมื่อเอาไปใช้ให้ ครอบใน try catch เนื่องจากมี throw error