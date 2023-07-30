export interface Session {
  sessionid: string // PK
  username: string
}

export interface IBaseTable<PPrefix extends string, SPrefix extends string> {
  pkid: `${PPrefix}${string}` // Partition Key
  skid: `${SPrefix}${string}` // Sort Key
}
