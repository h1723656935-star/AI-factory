import { SupabaseClient } from '@supabase/supabase-js'

export interface DatabaseOperationResult<T> {
  data: T | null
  error: Error | null
  fromCache: boolean
}

export class DatabaseOperation {
  constructor(
    private client: SupabaseClient | null,
    private options: {
      enableFallback?: boolean
      logErrors?: boolean
    } = {}
  ) {}

  async insert<T>(
    table: string,
    data: Record<string, any>,
    options: { select?: string; single?: boolean } = {}
  ): Promise<DatabaseOperationResult<T>> {
    if (!this.client) {
      return this.createFallbackResult<T>(null, '数据库未配置')
    }

    try {
      if (options.single) {
        const { data: result, error } = await this.client
          .from(table)
          .insert(data)
          .select(options.select || '*')
          .single()
        if (error) throw error
        return this.createSuccessResult<T>(result as T)
      } else {
        const { data: result, error } = await this.client
          .from(table)
          .insert(data)
          .select(options.select || '*')
        if (error) throw error
        return this.createSuccessResult<T>(result as T)
      }
    } catch (error) {
      if (this.options.logErrors) {
        console.warn(`数据库插入失败 [${table}]:`, error)
      }
      return this.createFallbackResult<T>(null, error instanceof Error ? error.message : '未知错误')
    }
  }

  async update<T>(
    table: string,
    data: Record<string, any>,
    filter: Record<string, any>
  ): Promise<DatabaseOperationResult<T>> {
    if (!this.client) {
      return this.createFallbackResult<T>(null, '数据库未配置')
    }

    try {
      let query = this.client.from(table).update(data)

      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data: result, error } = await query.select().single()
      if (error) throw error

      return this.createSuccessResult<T>(result as T)
    } catch (error) {
      if (this.options.logErrors) {
        console.warn(`数据库更新失败 [${table}]:`, error)
      }
      return this.createFallbackResult<T>(null, error instanceof Error ? error.message : '未知错误')
    }
  }

  async select<T>(
    table: string,
    filter: Record<string, any>,
    options: { single?: boolean; columns?: string } = {}
  ): Promise<DatabaseOperationResult<T>> {
    if (!this.client) {
      return this.createFallbackResult<T>(null, '数据库未配置')
    }

    try {
      let query = this.client.from(table).select(options.columns || '*')

      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      if (options.single) {
        const { data: result, error } = await query.single()
        if (error) throw error
        return this.createSuccessResult<T>(result as T)
      } else {
        const { data: result, error } = await query
        if (error) throw error
        return this.createSuccessResult<T>(result as T)
      }
    } catch (error) {
      if (this.options.logErrors) {
        console.warn(`数据库查询失败 [${table}]:`, error)
      }
      return this.createFallbackResult<T>(null, error instanceof Error ? error.message : '未知错误')
    }
  }

  private createSuccessResult<T>(data: T): DatabaseOperationResult<T> {
    return { data, error: null, fromCache: false }
  }

  private createFallbackResult<T>(data: T | null, errorMessage: string): DatabaseOperationResult<T> {
    return {
      data,
      error: this.options.enableFallback ? null : new Error(errorMessage),
      fromCache: true
    }
  }
}

export function createDatabaseOperation(
  client: SupabaseClient | null,
  options: { enableFallback?: boolean; logErrors?: boolean } = {}
): DatabaseOperation {
  return new DatabaseOperation(client, {
    enableFallback: true,
    logErrors: true,
    ...options
  })
}