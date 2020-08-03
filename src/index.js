/**
 * # 异步节流
 * @param execFunction 返回Promose对象的执行函数
 * @param options { key: '默认key', cacheType: '默认缓存类型', namespace: '命名空间' }
 */
export default class AsyncThrottle {
  constructor(execFunction, options = {}) {
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
    this.cacheDatas = {}
    this.execHappenings = {}
  }

  /**
   * # 节流执行
   * @param options { key: 缓存key, cacheType: 缓存类型 }
   * @param args 执行函数参数
   */
  throttleExec(options = {}, ...args) {
    const ops = {
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
    const key = ops.key
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
  setCache (options = {}, data) {
    const ops = {
      key: options.key || this.options.key,
      cacheType: (options.cacheType === undefined ? this.options.cacheType : options.cacheType)
    }
    if (ops.cacheType === 'instance') {
      this.cacheDatas[ops.key] = data
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
  getCache (key) {
    const KEY = key || this.options.key
    const StorageKEY = `AT_${ this.options.namespace ? (this.options.namespace + '_') : '' }${ KEY }`
    return JSON.parse(localStorage.getItem(StorageKEY) || sessionStorage.getItem(StorageKEY)) || this.cacheDatas[KEY]
  }

  /**
   * # 清除缓存
   * @param key 缓存key
   * @rerun true: 清除成功（有缓存）false: 清除无效（没有缓存）
   */
  clearCache(key) {
    let hasLocalCache = false
    let hasSessionCache = false
    let hasInstanceCache = false
    if (key === true) {
      if (this.options.namespace) {
        const reg = new RegExp('AT_' + this.options.namespace)
        const localCacheKeys = []
        for (let i = 0, len = localStorage.length; i < len; i++) {
          const KEY = localStorage.key(i)
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
          const KEY = sessionStorage.key(i)
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
    
    const KEY = key || this.options.key
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

AsyncThrottle.namespaces = []