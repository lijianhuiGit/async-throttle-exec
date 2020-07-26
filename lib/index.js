(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.AsyncThrottle = factory());
}(this, (function () { 'use strict';

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /**
   * # 异步节流
   * @param execFunction 返回Promose对象的执行函数
   * @param options { key: '默认key', cacheType: '默认缓存类型', namespace: '命名空间' }
   */
  var AsyncThrottle = /*#__PURE__*/function () {
    function AsyncThrottle(execFunction) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, AsyncThrottle);

      if (options.namespace) {
        try {
          if (AsyncThrottle.namespaces.includes(options.namespace)) {
            throw new Error("Namespace \"".concat(options.namespace, "\" already exists. ")); // 命名空间“A”已经存在。
          } else {
            AsyncThrottle.namespaces.push(options.namespace);
          }
        } catch (e) {
          console.error(e);
        }
      }

      this.exec = execFunction;
      this.options = {
        key: options.key || 'key',
        cacheType: options.cacheType === undefined ? false : options.cacheType,
        namespace: options.namespace
      };
      this.cacheDatas = {};
      this.execHappenings = {};
    }
    /**
     * # 节流执行
     * @param options { key: 缓存key, cacheType: 缓存类型 }
     * @param args 执行函数参数
     */


    _createClass(AsyncThrottle, [{
      key: "throttleExec",
      value: function throttleExec() {
        var _this = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var ops = {
          key: options.key || this.options.key,
          cacheType: options.cacheType === undefined ? this.options.cacheType : options.cacheType
        };

        try {
          if ((ops.cacheType === 'sessionStorage' || ops.cacheType === 'localStorage') && !this.options.namespace) {
            throw new Error("To use storage, you must provide a namespace. "); // 使用storage存储，必须提供命名空间。
          }
        } catch (e) {
          console.error(e);
        }

        var key = ops.key;

        if (ops.cacheType) {
          var cache = this.getCache(key);

          if (cache != null) {
            return Promise.resolve(cache);
          }
        }

        return new Promise( /*#__PURE__*/function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve, reject) {
            var result;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!(_this.execHappenings[key] && _this.execHappenings[key].status === 'pending')) {
                      _context.next = 5;
                      break;
                    }

                    _this.execHappenings[key].resolves.push(resolve);

                    _this.execHappenings[key].rejects.push(reject);

                    _context.next = 18;
                    break;

                  case 5:
                    _this.execHappenings[key] = {
                      status: 'pending',
                      resolves: [resolve],
                      rejects: [reject]
                    };
                    _context.prev = 6;
                    _context.next = 9;
                    return _this.exec.apply(_this, args);

                  case 9:
                    result = _context.sent;

                    if (result != null && ops.cacheType) {
                      _this.setCache(ops, result);
                    }

                    _this.execHappenings[key].resolves.forEach(function (res) {
                      return res(result);
                    });

                    _context.next = 17;
                    break;

                  case 14:
                    _context.prev = 14;
                    _context.t0 = _context["catch"](6);

                    _this.execHappenings[key].rejects.forEach(function (rej) {
                      return rej(_context.t0);
                    });

                  case 17:
                    delete _this.execHappenings[key];

                  case 18:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, null, [[6, 14]]);
          }));

          return function (_x, _x2) {
            return _ref.apply(this, arguments);
          };
        }());
      }
      /**
       * # 设置缓存
       * @param options { key: 缓存key, cacheType: 缓存类型 }
       * @param data 缓存数据
       */

    }, {
      key: "setCache",
      value: function setCache() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var data = arguments.length > 1 ? arguments[1] : undefined;
        var ops = {
          key: options.key || this.options.key,
          cacheType: options.cacheType === undefined ? this.options.cacheType : options.cacheType
        };

        if (ops.cacheType === 'instance') {
          this.cacheDatas[ops.key] = data;
        } else if (ops.cacheType === 'sessionStorage' || ops.cacheType === 'localStorage') {
          var k = "AT_".concat(this.options.namespace ? this.options.namespace + '_' : '').concat(ops.key);
          var d = typeof data === 'string' ? data : JSON.stringify(data);
          (ops.cacheType === 'localStorage' ? localStorage : sessionStorage).setItem(k, d);
        }
      }
      /**
      * # 获取缓存
      * @param key 缓存key
      * @return 缓存数据
      */

    }, {
      key: "getCache",
      value: function getCache(key) {
        var KEY = key || this.options.key;
        var StorageKEY = "AT_".concat(this.options.namespace ? this.options.namespace + '_' : '').concat(KEY);
        return JSON.parse(localStorage.getItem(StorageKEY) || sessionStorage.getItem(StorageKEY)) || this.cacheDatas[KEY];
      }
      /**
       * # 清除缓存
       * @param key 缓存key
       * @rerun true: 清除成功（有缓存）false: 清除无效（没有缓存）
       */

    }, {
      key: "clearCache",
      value: function clearCache(key) {
        var hasLocalCache = false;
        var hasSessionCache = false;
        var hasInstanceCache = false;

        if (key) {
          var KEY = key || this.options.key;
          var StorageKEY = "AT_".concat(this.options.namespace ? this.options.namespace + '_' : '').concat(KEY);
          hasLocalCache = localStorage.getItem(StorageKEY) != null;
          hasLocalCache && localStorage.removeItem(StorageKEY);
          hasSessionCache = sessionStorage.getItem(StorageKEY) != null;
          hasSessionCache && sessionStorage.removeItem(StorageKEY);
          hasInstanceCache = this.cacheDatas[KEY] != null;
          hasInstanceCache && delete this.cacheDatas[KEY];
          return hasLocalCache || hasSessionCache || hasInstanceCache;
        }

        if (this.options.namespace) {
          var reg = new RegExp('AT_' + this.options.namespace);
          var localCacheKeys = [];

          for (var i = 0, len = localStorage.length; i < len; i++) {
            var _KEY = localStorage.key(i);

            if (_KEY.search(reg) === 0) {
              localCacheKeys.push(_KEY);
            }
          }

          hasLocalCache = !!localCacheKeys.length;
          localCacheKeys.forEach(function (k) {
            localStorage.removeItem(k);
          });
          var sessionCacheKeys = [];

          for (var _i = 0, _len2 = sessionStorage.length; _i < _len2; _i++) {
            var _KEY2 = sessionStorage.key(_i);

            if (_KEY2.search(reg) === 0) {
              sessionCacheKeys.push(_KEY2);
            }
          }

          hasSessionCache = !!sessionCacheKeys.length;
          sessionCacheKeys.forEach(function (k) {
            sessionStorage.removeItem(k);
          });
        }

        hasInstanceCache = !!Object.keys(this.cacheDatas).length;

        if (hasInstanceCache) {
          this.cacheDatas = {};
        }

        return hasLocalCache || hasSessionCache || hasInstanceCache;
      }
    }]);

    return AsyncThrottle;
  }();
  AsyncThrottle.namespaces = [];

  return AsyncThrottle;

})));
