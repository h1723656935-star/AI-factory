import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationFailedError,
  RateLimitError,
  ServiceUnavailableError,
  successResponse,
  errorResponse,
  withApiHandler,
  getClientIp,
} from '@/lib/api'
import { logger } from '@/lib/logger'

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  },
  generateRequestId: jest.fn(() => 'req_test_123'),
}))

function createMockReqRes(method = 'GET', body: unknown = {}) {
  const req: any = {
    method,
    headers: {},
    body,
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/test',
  }
  const res: any = {
    statusCode: 200,
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('ApiError hierarchy', () => {
  it('ApiError carries statusCode and code', () => {
    const err = new ApiError('boom', 418, 'TEAPOT')
    expect(err.message).toBe('boom')
    expect(err.statusCode).toBe(418)
    expect(err.code).toBe('TEAPOT')
  })

  it('UnauthorizedError defaults to 401', () => {
    expect(new UnauthorizedError().statusCode).toBe(401)
  })

  it('ForbiddenError defaults to 403', () => {
    expect(new ForbiddenError().statusCode).toBe(403)
  })

  it('NotFoundError defaults to 404', () => {
    expect(new NotFoundError().statusCode).toBe(404)
  })

  it('ValidationFailedError includes details', () => {
    const err = new ValidationFailedError('invalid', { field: 'url' })
    expect(err.details).toEqual({ field: 'url' })
  })

  it('RateLimitError carries retryAfter', () => {
    const err = new RateLimitError(60)
    expect(err.retryAfter).toBe(60)
    expect(err.statusCode).toBe(429)
  })

  it('ServiceUnavailableError names the service', () => {
    const err = new ServiceUnavailableError('Supabase')
    expect(err.message).toContain('Supabase')
    expect(err.statusCode).toBe(503)
  })
})

describe('response helpers', () => {
  it('successResponse wraps data', () => {
    const { res } = createMockReqRes()
    successResponse(res, { foo: 1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ data: { foo: 1 } })
  })

  it('errorResponse wraps error object', () => {
    const { res } = createMockReqRes()
    errorResponse(res, 'fail', 400, 'BAD')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'fail', code: 'BAD', details: undefined },
    })
  })
})

describe('getClientIp', () => {
  it('uses x-forwarded-for header first', () => {
    const req: any = { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }, socket: { remoteAddress: '9.9.9.9' } }
    expect(getClientIp(req)).toBe('1.1.1.1')
  })

  it('falls back to socket remoteAddress', () => {
    const req: any = { headers: {}, socket: { remoteAddress: '127.0.0.1' } }
    expect(getClientIp(req)).toBe('127.0.0.1')
  })
})

describe('withApiHandler', () => {
  beforeEach(() => {
    ;(logger.info as jest.Mock).mockClear()
    ;(logger.warn as jest.Mock).mockClear()
    ;(logger.error as jest.Mock).mockClear()
  })

  it('attaches request id and logs success', async () => {
    const handler = jest.fn(async (_req, res) => {
      res.status(200).json({ ok: true })
    })
    const wrapped = withApiHandler(handler)
    const { req, res } = createMockReqRes()

    await wrapped(req, res)

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.any(String))
    expect(handler).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      'api_request',
      expect.objectContaining({ statusCode: 200 })
    )
  })

  it('translates ApiError to JSON response', async () => {
    const handler = jest.fn(async () => {
      throw new NotFoundError('not here')
    })
    const wrapped = withApiHandler(handler)
    const { req, res } = createMockReqRes()

    await wrapped(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'not here', code: 'NOT_FOUND', details: undefined },
    })
    expect(logger.warn).toHaveBeenCalled()
  })

  it('hides internal errors and logs them', async () => {
    const handler = jest.fn(async () => {
      throw new Error('database password leaked')
    })
    const wrapped = withApiHandler(handler)
    const { req, res } = createMockReqRes()

    await wrapped(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: { message: '服务器内部错误', code: 'INTERNAL_ERROR', details: undefined },
    })
    expect(logger.error).toHaveBeenCalled()
  })
})
