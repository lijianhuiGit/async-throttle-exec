// 执行函数
type ExecFunction = (...args: any[]) => Promise<any>

// 缓存类型
type CacheType = false | 'instance' | 'sessionStorage' | 'localStorage'

// 节流执行函数参数选项
interface ThrottleExecOptions {
  key?: string,
  cacheType?: CacheType
}

// 构造函数参数选项
interface ConstructorOptions extends ThrottleExecOptions {
  namespace?: string
}

// 当前执行情况
interface ExecHappenings {
  [key: string]: {
    status: 'pending',
    resolves: any[],
    rejects: any[]
  }
}

/**
 * # 异步节流
 * @param execFunction 返回Promose对象的执行函数
 * @param options { key: '默认key', cacheType: '默认缓存类型', namespace: '命名空间' }
 */
export default class AsyncThrottle {
  static namespaces: string[] = []
  exec: ExecFunction
  options: ConstructorOptions
  cacheDatas: { [key: string]: any } = {}
  execHappenings: ExecHappenings = {}
  constructor(execFunction: ExecFunction, options: ConstructorOptions = {}) {
    if (options.namespace) {
      try {
        if (AsyncThrottle.namespaces.includes(options.namespace)) {
          throw new Error(`Namespace "${options.namespace}" already exists. `) // 命名空间“A”已经存在。
        } else {
          AsyncThrottle.namespaces.push(options.namespace)
        }
      } catch (e) {
        console.error(e)
      }
    }
    this.exec = execFunction
    this.options = {
      key: options.key || 'key',
      cacheType: (options.cacheType === undefined ? false : options.cacheType),
      namespace: options.namespace
    }
  }

  /**
   * # 节流执行
   * @param options { key: 缓存key, cacheType: 缓存类型 }
   * @param args 执行函数参数
   */
  throttleExec(options: ThrottleExecOptions = {}, ...args: any[]): Promise<any> {
    const ops: ThrottleExecOptions = {
      key: options.key || this.options.key,
      cacheType: (options.cacheType === undefined ? this.options.cacheType : options.cacheType)
    }
    try {
      if ((ops.cacheType === 'sessionStorage' || ops.cacheType === 'localStorage') && !this.options.namespace) {
        throw new Error(`To use storage, you must provide a namespace. `) // 使用storage存储，必须提供命名空间。
      }
    } catch (e) {
      console.error(e)
    }
    const key = (ops.key as string)
    if (ops.cacheType) {
      const cache = this.getCache(key)
      if (cache != null) {
        return Promise.resolve(cache)
      }
    }
    return new Promise(async (resolve, reject) => {
      if (this.execHappenings[key] && this.execHappenings[key].status === 'pending') {
        this.execHappenings[key].resolves.push(resolve)
        this.execHappenings[key].rejects.push(reject)
      } else {
        this.execHappenings[key] = { status: 'pending', resolves: [resolve], rejects: [reject] }
        try {
          const result = await this.exec(...args)
          if (result != null && ops.cacheType) {
            this.setCache(ops, result)
          }
          this.execHappenings[key].resolves.forEach(res => res(result))
        } catch (e) {
          this.execHappenings[key].rejects.forEach(rej => rej(e))
        }
        delete this.execHappenings[key]
      }
    })
  }

  /**
   * # 设置缓存
   * @param options { key: 缓存key, cacheType: 缓存类型 }
   * @param data 缓存数据
   */
  setCache (options: ThrottleExecOptions = {}, data: any): void {
    const ops = {
      key: options.key || this.options.key,
      cacheType: (options.cacheType === undefined ? this.options.cacheType : options.cacheType)
    }
    if (ops.cacheType === 'instance') {
      this.cacheDatas[(ops.key as string)] = data
    } else if (ops.cacheType === 'sessionStorage' || ops.cacheType === 'localStorage') {
      const k = `AT_${ this.options.namespace ? (this.options.namespace + '_') : '' }${ ops.key }`
      const d = (typeof data === 'string') ? data : JSON.stringify(data);
      (ops.cacheType === 'localStorage' ? localStorage : sessionStorage).setItem(k, d)
    }
  }

   /**
   * # 获取缓存
   * @param key 缓存key
   * @return 缓存数据
   */
  getCache (key: string): any {
    const KEY = key || this.options.key
    const StorageKEY = `AT_${ this.options.namespace ? (this.options.namespace + '_') : '' }${ KEY }`
    return JSON.parse((localStorage.getItem(StorageKEY) || sessionStorage.getItem(StorageKEY) as string)) || this.cacheDatas[(KEY as string)]
  }

  /**
   * # 清除缓存
   * @param key 缓存key
   * @rerun true: 清除成功（有缓存）false: 清除无效（没有缓存）
   */
  clearCache(key?: string | true): boolean {
    let hasLocalCache: boolean = false
    let hasSessionCache: boolean = false
    let hasInstanceCache: boolean = false
    if (key === true) {
      if (this.options.namespace) {
        const reg = new RegExp('AT_' + this.options.namespace)
        const localCacheKeys = []
        for (let i = 0, len = localStorage.length; i < len; i++) {
          const KEY = (localStorage.key(i) as string)
          if (KEY.search(reg) === 0) {
            localCacheKeys.push(KEY)
          }
        }
        hasLocalCache = !!(localCacheKeys.length)
        localCacheKeys.forEach(k => {
          localStorage.removeItem(k)
        })
        const sessionCacheKeys = []
        for (let i = 0, len = sessionStorage.length; i < len; i++) {
          const KEY = (sessionStorage.key(i) as string)
          if (KEY.search(reg) === 0) {
            sessionCacheKeys.push(KEY)
          }
        }
        hasSessionCache = !!(sessionCacheKeys.length)
        sessionCacheKeys.forEach(k => {
          sessionStorage.removeItem(k)
        })
      }
  
      hasInstanceCache = !!(Object.keys(this.cacheDatas).length)
      if (hasInstanceCache) {
        this.cacheDatas = {}
      }
  
      return (hasLocalCache || hasSessionCache || hasInstanceCache)
    }
    
    const KEY = ((key || this.options.key) as string)
    const StorageKEY = `AT_${ this.options.namespace ? (this.options.namespace + '_') : '' }${ KEY }`

    hasLocalCache = localStorage.getItem(StorageKEY) != null
    hasLocalCache && localStorage.removeItem(StorageKEY)

    hasSessionCache = sessionStorage.getItem(StorageKEY) != null
    hasSessionCache && sessionStorage.removeItem(StorageKEY)

    hasInstanceCache = this.cacheDatas[KEY] != null
    hasInstanceCache && delete this.cacheDatas[KEY]

    return (hasLocalCache || hasSessionCache || hasInstanceCache)
  }
}