/* eslint-disable @typescript-eslint/space-before-function-paren */

import appLogger from '../appLogger'

interface UserSocketSession {
  refreshTokenId: string
}

class PresenceSystem {
  private connectedUsers: Record<string, Record<string, UserSocketSession>> = {}
  constructor() {
    appLogger.info('Presence System initialized')
  }

  addUserSocketSession(userId: string, connectionId: string, userSocketSession: UserSocketSession): void {
    if (this.connectedUsers[userId] == null) {
      this.connectedUsers[userId] = {}
    }

    if (this.connectedUsers[userId][connectionId] != null) {
      // this connectionId already exists
      // TODO Handle this case
    }

    this.connectedUsers[userId] = {
      ...this.connectedUsers[userId],
      [connectionId]: userSocketSession
    }

    appLogger.info(`Presence recorded for ${userId} with id ${connectionId}`)
  }

  /**
   * Fetches record of all active socket sessions for given user.
   * @param userId of a user whose active socket sessions will be fetched
   * @returns empty record if no active socket session for given user,
   * and returns record of all active socket session for given user with
   * socket id as keys and session details as values
   */
  getAllUserSocketSessions(userId: string): Record<string, UserSocketSession> {
    if (this.connectedUsers[userId] == null) return {}
    return this.connectedUsers[userId]
  }

  removeUserSocketSession(userId: string, connectionId: string): void {
    if (this.connectedUsers[userId][connectionId] == null) return
    // TODO: Revert this disable rule. Dangerous. Move datatype to Map or Set
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.connectedUsers[userId][connectionId]
    appLogger.info(`Presence removed for ${userId} with id ${connectionId}}`)
  }

  getUsers(): Record<string, Record<string, UserSocketSession>> {
    return this.connectedUsers
  }
}

export default PresenceSystem
