### 安装
``` node
npm install async-throttle-exec --save
```

### 导入  
``` js
import AsyncThrottle from 'async-throttle-exec'
```

### 实例化
``` js
// 传入返回Promise对象的执行函数作为参数
const getUser = new AsyncThrottle(() => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ name: 'Joseph' })
    }, 2000)
  })
})
```

### 异步节流执行
``` js
getUser.throttleExec().then(user => {
  // user => { name: 'Joseph' }
})

// 多次调用, 实例化传入的执行函数只会执行一次, .then方法里的回调函数又能全部执行
getUser.throttleExec().then()
getUser.throttleExec().then()
```

### 使用缓存
``` js
getUser.throttleExec({ key: 'user_info', cacheType: 'instance' }).then()
```
* @param1 { object } options
  - { string } key ['key'] 缓存key
  - { false | 'instance' | 'sessionStorage' | 'localStorage' } cacheType [false] 缓存类型（false: 不使用缓存）

* @param2 @param3 ...
  - 第二参数开始的其它形参是实例化传入的执行函数的形参

### 实例化设置默认参数
``` js
const options = {
  key: 'user_info',
  cacheType: 'sessionStorage',
  namespaces: 'user'
}
const getUser = new AsyncThrottle(() => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ name: 'Joseph' })
    }, 2000)
  })
}, options)
```
* @param1 { function } execFunction 执行函数

* @param2 { object } options
  - { string } key ['key'] 缓存key
  - { false | 'instance' | 'sessionStorage' | 'localStorage' } cacheType [false] 缓存类型（false: 不使用缓存）
  - { string } namespaces 命名空间（使用 sessionStorage/localStorage 缓存必须设置 命名空间）

### 清除缓存
``` js
getUser.clearCache(key)
```
* @param { string } key 被清除缓存key
