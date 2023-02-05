import supertest from 'supertest'
import createApp from '../app'

const app = createApp()

describe('Express Application Test Suite', () => {
  describe('Given user is not authenticated, ', () => {
    test('when accessing / route, it should redirect to /register', async () => {
      const response = await supertest(app).get('/')
      expect(response.statusCode).toBe(302)
      expect(response.redirect).toBe(true)
      expect(response.get('location')).toBe('/register')
      expect(response.type).toBe('text/plain')
    })
  })
})
