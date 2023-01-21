export interface Session {
    sessionid: string, // PK
    username: string,
}

export interface User {
    username: string, // PK
    password: string,
    friends: string[],
    gender: string,
    email: string,
}