import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest, hrApi, notificationsApi } from '../../api/client'

// Mock fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('apiRequest', () => {
    it('должен делать GET запрос', async () => {
      const mockResponse = { data: 'test' }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiRequest('/test')

      expect(global.fetch).toHaveBeenCalledWith('', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockResponse)
    })

    it('должен выбрасывать ошибку при неудачном запросе', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      })

      await expect(apiRequest('/test')).rejects.toThrow('Not found')
    })
  })

  describe('hrApi', () => {
    it('должен получать список вакансий', async () => {
      const mockVacancies = [{ id: 1, title: 'Test' }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVacancies
      })

      const result = await hrApi.vacancies()

      expect(global.fetch).toHaveBeenCalledWith('/api/vacancies', expect.any(Object))
      expect(result).toEqual(mockVacancies)
    })

    it('должен создавать вакансию', async () => {
      const newVacancy = { title: 'New', department: 'IT', description: 'Test', required_skills: [] }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...newVacancy, id: 1, status: 'open' })
      })

      const result = await hrApi.createVacancy(newVacancy)

      expect(global.fetch).toHaveBeenCalledWith('/api/vacancies', expect.objectContaining({
        method: 'POST',
      }))
      expect(result.id).toBe(1)
    })
  })

  describe('notificationsApi', () => {
    it('должен получать уведомления', async () => {
      const mockNotifications = [{ id: '1', title: 'Test' }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotifications
      })

      const result = await notificationsApi.getNotifications(10, false)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications?limit=10&unread_only=false',
        expect.any(Object)
      )
      expect(result).toEqual(mockNotifications)
    })

    it('должен получать количество непрочитанных', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 5 })
      })

      const result = await notificationsApi.getUnreadCount()

      expect(result).toEqual({ count: 5 })
    })

    it('должен отмечать уведомление как прочитанное', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const result = await notificationsApi.markAsRead('notification-123')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/notification-123/read',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual({ success: true })
    })
  })
})
