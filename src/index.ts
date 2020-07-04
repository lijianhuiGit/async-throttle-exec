interface Exec {
  (...args: any[]): Promise<any>
}

type CacheType = 'instance' | 'sessionStorage' | 'localStorage'

interface Options {
  key?: string,
  cacheType?: CacheType
}

interface ExecHappenings {
  [key: string]: {
    status: 'pending',
    resolves: any[],
    rejects: any[]
  }
}

export default class AsyncThrottle {
  exec: Exec
  namespaces: string
  cacheDatas: { [key: string]: any } = {}
  execHappenings: ExecHappenings = {}
  constructor(exec: Exec, namespaces: string = '') {
    this.exec = exec
    this.namespaces = namespaces
  }
  throttleExec(options: Options = {}, ...args: any[]): Promise<any> {
    if (options.cacheType !== 'instance' && !options.key) {
      console.warn('throttleExec方法请提供“key”!')
    }
    const ops = { key: options.key || 'default', cacheType: options.cacheType }
    const cache = this.getCache(ops.key)
    if (cache != null) {
      return Promise.resolve(cache)
    }
    return new Promise(async (resolve, reject) => {
      if (this.execHappenings[ops.key] && this.execHappenings[ops.key].status === 'pending') {
        this.execHappenings[ops.key].resolves.push(resolve)
        this.execHappenings[ops.key].rejects.push(reject)
      } else {
        this.execHappenings[ops.key] = { status: 'pending', resolves: [], rejects: [] }
        try {
          const result = await this.exec(...args)
          if (result != null && ops.cacheType) {
            this.setCache(ops.key, ops.cacheType, result)
          }
          this.execHappenings[ops.key].resolves.forEach(res => res(result))
        } catch (e) {
          this.execHappenings[ops.key].rejects.forEach(rej => rej(e))
        }
        delete this.execHappenings[ops.key]
      }
    })
  }
  setCache (key: string, type: CacheType, data: any): void {
    if (type === 'instance') {
      this.cacheDatas[key] = data
    } else {
      const k = `AT_${ this.namespaces ? (this.namespaces + '_') : '' }${ key }`
      const d = (typeof data === 'string') ? data : JSON.stringify(data)
      ;(type === 'localStorage' ? localStorage : sessionStorage).setItem(k, d)
    }
  }
  getCache (key: string): any {
    const k = `AT_${ this.namespaces ? (this.namespaces + '_') : '' }${ key }`
    return this.cacheDatas[key] || JSON.parse((sessionStorage.getItem(k) || localStorage.getItem(k) as string))
  }
  clearCache(key: string): boolean {
    const k = `AT_${ this.namespaces ? (this.namespaces + '_') : '' }${ key }`

    const hasExamplesCache = this.cacheDatas[key]
    hasExamplesCache && delete this.cacheDatas[key]

    const hasSessionCache = sessionStorage.getItem(k)
    hasSessionCache && sessionStorage.removeItem(k)

    const hasLocalCache = localStorage.getItem(k)
    hasLocalCache && localStorage.removeItem(k)

    return (hasExamplesCache || hasSessionCache || hasLocalCache)
  }
}
