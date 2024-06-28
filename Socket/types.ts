import { type Server, type Socket } from 'socket.io'
import { type DefaultEventsMap } from 'socket.io/dist/typed-events'

export type SocketRef<T = any> = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, T>
export type SocketServerRef = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>

export interface InitiateCall {
  userToCall: string
  offer: any
}

export interface IceCandidate {
  from: string
  candidate: any
}

export interface AnswerCall {
  userToAnswer: string
  answer: any
}
