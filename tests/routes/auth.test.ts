import supertest from 'supertest'
import createApp from '../../app'

const app = createApp()

describe('Getting started with Supertest', () => {
  describe('Given <precondition>', () => {
    it('should or when and should', async () => {
      const response = await supertest(app).get('/')
      expect(response.statusCode).toBe(302)
      expect(response.redirect).toBe(true)
      expect(response.get('location')).toBe('/register')
      expect(response.type).toBe('text/plain')
    })
  })
})
