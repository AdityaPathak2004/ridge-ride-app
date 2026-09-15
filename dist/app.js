(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p2 = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p3 = fn(...args);
                  remove = p3 === null || p3 === void 0 ? void 0 : p3.remove;
                  return p3;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p2.remove = async () => remove();
              }
              return p2;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p2 = new Promise((resolve) => call.then(() => resolve({ remove })));
            p2.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p2;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p2 = Promise.resolve({ remove });
          return p2;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/local-notifications/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    LocalNotificationsWeb: () => LocalNotificationsWeb
  });
  var LocalNotificationsWeb;
  var init_web = __esm({
    "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
      init_dist();
      LocalNotificationsWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.pending = [];
          this.deliveredNotifications = [];
          this.hasNotificationSupport = () => {
            if (!("Notification" in window) || !Notification.requestPermission) {
              return false;
            }
            if (Notification.permission !== "granted") {
              try {
                new Notification("");
              } catch (e) {
                if (e instanceof Error && e.name === "TypeError") {
                  return false;
                }
              }
            }
            return true;
          };
        }
        async getDeliveredNotifications() {
          const deliveredSchemas = [];
          for (const notification of this.deliveredNotifications) {
            const deliveredSchema = {
              title: notification.title,
              id: parseInt(notification.tag),
              body: notification.body
            };
            deliveredSchemas.push(deliveredSchema);
          }
          return {
            notifications: deliveredSchemas
          };
        }
        async removeDeliveredNotifications(delivered) {
          for (const toRemove of delivered.notifications) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
          }
        }
        async removeDeliveredNotificationsById(options) {
          for (const id of options.ids) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter((n) => n !== found);
          }
        }
        async removeAllDeliveredNotifications() {
          for (const notification of this.deliveredNotifications) {
            notification.close();
          }
          this.deliveredNotifications = [];
        }
        async getByIds(options) {
          const ids = options.ids.map((id) => String(id));
          const scheduled = this.pending.filter((n) => ids.includes(String(n.id)));
          const delivered = this.deliveredNotifications.filter((n) => ids.includes(n.tag)).map((n) => this.deliveredToSchema(n));
          return { notifications: [...scheduled, ...delivered] };
        }
        async getAll(options) {
          const scheduled = [...this.pending];
          const delivered = this.deliveredNotifications.map((n) => this.deliveredToSchema(n));
          if ((options === null || options === void 0 ? void 0 : options.state) === "SCHEDULED") {
            return { notifications: scheduled };
          }
          if ((options === null || options === void 0 ? void 0 : options.state) === "TRIGGERED") {
            return { notifications: delivered };
          }
          return { notifications: [...scheduled, ...delivered] };
        }
        deliveredToSchema(notification) {
          return {
            title: notification.title,
            id: parseInt(notification.tag),
            body: notification.body
          };
        }
        async createChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async listChannels() {
          throw this.unimplemented("Not implemented on web.");
        }
        async schedule(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          for (const notification of options.notifications) {
            this.sendNotification(notification);
          }
          return {
            notifications: options.notifications.map((notification) => ({
              id: notification.id
            }))
          };
        }
        async update(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const updated = [];
          for (const notification of options.notifications) {
            const index = this.pending.findIndex((n) => n.id === notification.id);
            if (index === -1) {
              continue;
            }
            this.pending.splice(index, 1);
            this.sendNotification(notification);
            updated.push(notification);
          }
          return {
            notifications: updated.map((notification) => ({ id: notification.id }))
          };
        }
        async getPending() {
          return {
            notifications: this.pending
          };
        }
        async cancelAll() {
          this.pending = [];
        }
        async registerActionTypes() {
          throw this.unimplemented("Not implemented on web.");
        }
        async cancel(pending) {
          this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
        }
        async areEnabled() {
          const { display } = await this.checkPermissions();
          return {
            value: display === "granted"
          };
        }
        async changeExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async checkExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(await Notification.requestPermission());
          return { display };
        }
        async checkPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(Notification.permission);
          return { display };
        }
        transformNotificationPermission(permission) {
          switch (permission) {
            case "granted":
              return "granted";
            case "denied":
              return "denied";
            default:
              return "prompt";
          }
        }
        sendPending() {
          var _a;
          const toRemove = [];
          const now = (/* @__PURE__ */ new Date()).getTime();
          for (const notification of this.pending) {
            if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
              this.buildNotification(notification);
              toRemove.push(notification);
            }
          }
          this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
        }
        sendNotification(notification) {
          var _a;
          if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
            const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
            this.pending.push(notification);
            setTimeout(() => {
              this.sendPending();
            }, diff);
            return;
          }
          this.buildNotification(notification);
        }
        buildNotification(notification) {
          const localNotification = new Notification(notification.title, {
            body: notification.body,
            tag: String(notification.id)
          });
          localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
          localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
          localNotification.addEventListener("close", () => {
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
          }, false);
          this.deliveredNotifications.push(localNotification);
          return localNotification;
        }
        onClick(notification) {
          const data = {
            actionId: "tap",
            notification
          };
          this.notifyListeners("localNotificationActionPerformed", data);
        }
        onShow(notification) {
          this.notifyListeners("localNotificationReceived", notification);
        }
      };
    }
  });

  // dist/app.src.js
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/definitions.js
  var Weekday;
  (function(Weekday2) {
    Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
    Weekday2[Weekday2["Monday"] = 2] = "Monday";
    Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
    Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
    Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
    Weekday2[Weekday2["Friday"] = 6] = "Friday";
    Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
  })(Weekday || (Weekday = {}));

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  var LocalNotifications = registerPlugin("LocalNotifications", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.LocalNotificationsWeb())
  });

  // dist/schedule.js
  var DATA = { timezone: "America/New_York", season: "Fall 2026", updated: "2026-09-15", weekdays: [1, 2, 3, 4, 5], breaks: [610, 970], villas: [430, 450, 470, 490, 510, 530, 550, 590, 610, 630, 650, 670, 690, 710, 730, 750, 770, 790, 810, 830, 850, 870, 890, 910, 930, 950, 970, 990, 1010, 1030, 1050, 1070, 1090, 1110, 1130, 1150, 1170, 1190, 1205, 1230, 1250, 1265, 1285, 1310, 1325, 1350, 1370], market: { stops: ["Sweethome", "Villas at Chestnut Ridge", "UB Rensch Loop", "Target", "Wegmans"], rows: [[720, 725, 730, 748, 755], [780, 785, 790, 805, 815], [840, 845, 850, 865, 875], [900, 905, 910, null, null]] } };
  var ROUTE_MODEL = { minutes: 5, observations: 4, matches: 4, confidence: (4 + 1) / (4 + 2) };
  var DEFAULTS = { outbound: ROUTE_MODEL.minutes, wait: 0, inbound: ROUTE_MODEL.minutes, villasWait: 0, breakMode: "skip", singleBus: false };
  function localParts(now = /* @__PURE__ */ new Date()) {
    const p2 = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: DATA.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now).map((p3) => [p3.type, p3.value]));
    return { date: `${p2.year}-${p2.month}-${p2.day}`, minute: +p2.hour * 60 + +p2.minute, second: +p2.second };
  }
  function addDays(day, n) {
    const d = /* @__PURE__ */ new Date(day + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function dayOfWeek(day) {
    return (/* @__PURE__ */ new Date(day + "T12:00:00Z")).getUTCDay();
  }
  function epoch(day, minute) {
    const target = Date.parse(day + "T00:00:00Z") + minute * 6e4;
    let guess = target;
    for (let i = 0; i < 4; i++) {
      const p2 = localParts(new Date(guess));
      const actual = Date.parse(p2.date + "T00:00:00Z") + p2.minute * 6e4 + p2.second * 1e3;
      guess += target - actual;
    }
    return guess;
  }
  function time(minute) {
    const m = (minute % 1440 + 1440) % 1440;
    return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;
  }
  function dateLabel(day) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(day + "T12:00:00Z"));
  }
  function ready(s) {
    return Number.isFinite(s.outbound) && Number.isFinite(s.wait);
  }
  function daily(day, direction2, s = DEFAULTS) {
    const dow = dayOfWeek(day);
    if (dow === 6) {
      const vIdx = DATA.market.stops.indexOf("Villas at Chestnut Ridge");
      const cIdx = DATA.market.stops.indexOf("UB Rensch Loop");
      const dIdx = direction2 === "home" ? cIdx : vIdx;
      return DATA.market.rows.map((r) => {
        const dep = r[dIdx];
        if (dep === null) return null;
        return { serviceDate: day, minute: dep, at: epoch(day, dep), arrival: epoch(day, direction2 === "home" ? r[vIdx] : r[cIdx]), base: dep, estimated: false, uncertain: false };
      }).filter((x) => x !== null);
    }
    if (!DATA.weekdays.includes(dow)) return [];
    if (direction2 === "home" && !ready(s)) return [];
    return DATA.villas.filter((m) => s.breakMode !== "skip" || !DATA.breaks.includes(m)).map((m) => {
      const dep = m + s.villasWait + (direction2 === "home" ? s.outbound + s.wait : 0);
      const ride = direction2 === "home" ? s.inbound : s.outbound;
      return { serviceDate: day, minute: dep, at: epoch(day, dep), arrival: Number.isFinite(ride) ? epoch(day, dep + ride) : null, base: m, estimated: direction2 === "home", uncertain: DATA.breaks.includes(m) && s.breakMode !== "skip" };
    });
  }
  function upcoming(now, direction2, s = DEFAULTS, count = 3, exact = false) {
    const day = localParts(new Date(now)).date;
    const threshold = exact ? now : Math.floor(now / 6e4) * 6e4;
    const all = [];
    for (let i = -1; i < 9; i++) all.push(...daily(addDays(day, i), direction2, s));
    return all.filter((t) => t.at >= threshold).sort((a, b) => a.at - b.at).slice(0, count);
  }
  function conflicts(s) {
    if (!s.singleBus || !ready(s) || !Number.isFinite(s.inbound)) return [];
    const a = DATA.villas.filter((m) => s.breakMode !== "skip" || !DATA.breaks.includes(m));
    return a.slice(0, -1).filter((m, i) => m + s.villasWait + s.outbound + s.wait + s.inbound > a[i + 1]);
  }

  // dist/app.src.js
  var $ = (id) => document.getElementById(id);
  var storage = { get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }, set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
    }
  } };
  var settings = { ...DEFAULTS };
  var direction = storage.get("ridge-direction") === "home" ? "home" : "campus";
  var selectedRoute = "campus";
  var plan = null;
  function when(t, now) {
    const d = localParts(new Date(t.at));
    return d.date === localParts(new Date(now)).date ? "Today" : dateLabel(d.date);
  }
  function rows(trips, now) {
    return trips.map((t, i) => {
      const p2 = localParts(new Date(t.at));
      const mins = Math.max(0, Math.ceil((t.at - now) / 6e4));
      return `<div class="trip-row"><div><strong>${time(p2.minute)}</strong><small>${when(t, now)}${t.estimated ? " \xB7 Estimated" : ""}${t.uncertain ? " \xB7 Red time: unconfirmed" : ""}${t.arrival ? ` \xB7 Est. arrival ${time(localParts(new Date(t.arrival)).minute)}${localParts(new Date(t.arrival)).date !== p2.date ? " next day" : ""}` : ""}</small></div><span class="badge">${mins === 0 ? "Scheduled now" : mins < 60 ? `${mins} min` : i === 0 ? "Next bus" : "Later"}</span></div>`;
    }).join("");
  }
  function setDirection(value) {
    direction = value;
    storage.set("ridge-direction", value);
    render();
    if (plan) renderPlan();
  }
  function render() {
    const now = Date.now(), p2 = localParts();
    $("today").textContent = dateLabel(p2.date);
    $("campusDirection").setAttribute("aria-pressed", direction === "campus");
    $("homeDirection").setAttribute("aria-pressed", direction === "home");
    $("nextLabel").textContent = direction === "campus" ? "NEXT AT THE VILLAS" : "NEXT FROM COLLEGE \xB7 ESTIMATE";
    $("fromStop").textContent = direction === "campus" ? "Villas at Chestnut Ridge" : "College \xB7 stop to confirm";
    $("toStop").textContent = direction === "campus" ? "College \xB7 stop to confirm" : "Villas at Chestnut Ridge";
    const trips = upcoming(now, direction, settings);
    const next = trips[0];
    if (false) {
    } else if (next) {
      const np = localParts(new Date(next.at)), mins = Math.max(0, Math.ceil((next.at - now) / 6e4));
      let title = mins === 0 ? "Scheduled now" : mins < 60 ? `${mins} <small>min away</small>` : mins < 1440 ? `${Math.floor(mins / 60)}<small>h</small> ${mins % 60}<small>m away</small>` : `${Math.floor(mins / 1440)} <small>days away</small>`;
      const ended = np.date !== p2.date;
      $("hero").innerHTML = `<div class="countdown"${mins === 0 ? ' style="font-size:40px;letter-spacing:-1px"' : ""}>${title}</div><p class="departure">${ended ? "Next service \xB7 " : ""}${time(np.minute)}${ended ? " \xB7 " + dateLabel(np.date) : " today"}${direction === "home" ? " \xB7 estimated" : ""}</p>${ended ? '<p class="small">No more scheduled trips today.</p>' : ""}`;
      $("upcoming").innerHTML = rows(trips, now);
    } else {
      $("hero").innerHTML = '<h2 class="hero-empty">No scheduled trips</h2>';
      $("upcoming").innerHTML = '<p class="empty">Check the schedule or your settings.</p>';
    }
    const c = conflicts(settings);
    $("assumptions").textContent = `Automatic route estimate: ${ROUTE_MODEL.minutes} minutes from the Villas to the campus loop and back, inferred from ${ROUTE_MODEL.matches}/${ROUTE_MODEL.observations} matching Saturday observations (${Math.round(ROUTE_MODEL.confidence * 100)}% smoothed pattern confidence). College departures are estimated; red weekday trips are skipped.` + (c.length ? ` ${c.length} turnaround conflicts were detected.` : "");
    const printed = DATA.villas.map((m) => ({ base: m, minute: m + settings.villasWait + (direction === "home" && ready(settings) ? settings.outbound + settings.wait : 0) }));
    $("fullSchedule").innerHTML = printed.map((t) => {
      const br = DATA.breaks.includes(t.base);
      return `<span class="time-cell${br ? " break" : next && next.base === t.base && next.serviceDate === p2.date ? " highlight" : ""}" title="${br ? "Red break marker; " + (settings.breakMode === "skip" ? "trip skipped" : "boarding uncertain") : direction === "home" ? "Estimated college departure" : "Printed Villas boarding time"}">${br ? "\u2161 " : ""}${time(t.minute)}${t.minute >= 1440 ? " +1d" : ""}</span>`;
    }).join("");
    $("connection").textContent = navigator.onLine ? "Timetable \xB7 not live tracking" : "Offline \xB7 using the saved timetable";
  }
  function renderPlan() {
    if (!plan) return;
    const at = epoch(plan.date, plan.minute);
    const trips = upcoming(at, direction, settings, 3, true);
    $("planResults").innerHTML = (trips[0] && localParts(new Date(trips[0].at)).date !== plan.date ? '<p class="small muted">No trips after your selected time that day. Next available service:</p>' : "") + rows(trips, at) + '<p class="small muted">Uses the weekly pattern; holidays and service changes are unconfirmed. Red break trips are excluded.</p>';
  }
  $("campusDirection").onclick = () => setDirection("campus");
  $("homeDirection").onclick = () => setDirection("home");
  $("alarmBtn").onclick = () => {
    const trips = upcoming(Date.now(), direction, settings);
    const next = trips[0];
    if (!next) return alert("No upcoming trips to set an alarm for.");
    function scheduleAlarm() {
      const alarmTime = next.at - 10 * 60 * 1e3;
      const msUntilAlarm = alarmTime - Date.now();
      const depTime = time(localParts(new Date(next.at)).minute);
      if (msUntilAlarm > 0) {
        new Notification("Alarm Set!", { body: `We'll remind you 10 mins before the ${depTime} shuttle.`, icon: "clean_bus.svg" });
        setTimeout(() => {
          new Notification("Shuttle Departing Soon", { body: `Your shuttle departs at ${depTime}. Time to get ready!`, icon: "clean_bus.svg" });
        }, msUntilAlarm);
      } else {
        new Notification("Shuttle Departing Now", { body: `Your shuttle departs at ${depTime}!`, icon: "clean_bus.svg" });
      }
      const p2 = $("alarmPopup");
      p2.classList.remove("hidden");
      void p2.offsetWidth;
      p2.classList.add("show");
      setTimeout(() => {
        p2.classList.remove("show");
        setTimeout(() => p2.classList.add("hidden"), 300);
      }, 2e3);
    }
    const handlePermission = (permission) => {
      if (permission === "granted") scheduleAlarm();
    };
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().then((result) => {
        if (result.display === "granted") {
          const alarmTime = next.at - 10 * 60 * 1e3;
          const depTime = time(localParts(new Date(next.at)).minute);
          LocalNotifications.schedule({
            notifications: [{
              title: "Shuttle Departing Soon",
              body: `Your shuttle departs at ${depTime}. Time to get ready!`,
              id: 1,
              schedule: { at: new Date(alarmTime > Date.now() ? alarmTime : Date.now() + 1e3) }
            }]
          });
          const p2 = $("alarmPopup");
          p2.classList.remove("hidden");
          void p2.offsetWidth;
          p2.classList.add("show");
          setTimeout(() => {
            p2.classList.remove("show");
            setTimeout(() => p2.classList.add("hidden"), 300);
          }, 2e3);
        }
      });
    } else {
      if (!("Notification" in window)) {
        alert("This browser does not support web notifications.");
      } else if (Notification.permission === "granted") {
        scheduleAlarm();
      } else if (Notification.permission !== "denied") {
        const permPromise = Notification.requestPermission(handlePermission);
        if (permPromise) {
          permPromise.then(handlePermission);
        }
      } else {
        alert("Please enable notifications in your browser settings to use the alarm.");
      }
    }
  };
  $("showTimetableBtn").onclick = () => {
    const p2 = $("timetablePopup");
    p2.classList.remove("hidden");
    void p2.offsetWidth;
    p2.classList.add("show");
  };
  $("closeTimetableBtn").onclick = () => {
    const p2 = $("timetablePopup");
    p2.classList.remove("show");
    setTimeout(() => p2.classList.add("hidden"), 300);
  };
  function setRoute(r) {
    selectedRoute = r;
    $("campus").hidden = r !== "campus";
    $("market").hidden = r !== "market";
    $("weekdayTab").setAttribute("aria-pressed", r === "campus");
    $("marketTab").setAttribute("aria-pressed", r === "market");
  }
  $("weekdayTab").onclick = () => setRoute("campus");
  $("marketTab").onclick = () => setRoute("market");
  $("marketStops").innerHTML = DATA.market.stops.map((s, i) => `<span>${i + 1}. ${s}</span>`).join("");
  $("marketTable").innerHTML = DATA.market.rows.map((row, i) => `<section class="market-round"><h3>${i === 3 ? "Final printed round \xB7 boarding unconfirmed" : `Round ${i + 1}`}</h3><div class="market-grid">${row.map((m, j) => `<div${i === 2 && j < 2 ? ' class="red"' : ""}><small>${DATA.market.stops[j]}</small><strong>${m === null ? "\u2014" : time(m)}</strong>${i === 2 && j < 2 ? "<em>Final departure</em>" : ""}</div>`).join("")}</div></section>`).join("");
  var p = localParts();
  $("planDate").value = p.date;
  $("planTime").value = `${String(Math.floor(p.minute / 60)).padStart(2, "0")}:${String(p.minute % 60).padStart(2, "0")}`;
  $("plannerForm").onsubmit = (e) => {
    e.preventDefault();
    const [h, m] = $("planTime").value.split(":").map(Number);
    plan = { date: $("planDate").value, minute: h * 60 + m };
    renderPlan();
  };
  render();
  setInterval(render, 1e3);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
  window.addEventListener("pageshow", render);
  window.addEventListener("online", render);
  window.addEventListener("offline", render);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {
  });
  var mc = document.modelContext;
  if (mc?.registerTool) {
    try {
      Promise.resolve(mc.registerTool({ name: "plan_shuttle_trip", title: "Plan a shuttle trip", description: "Set direction, date and ready-at time, and display the next three weekday departures using the automatic 5-minute campus route estimate.", inputSchema: { type: "object", properties: { direction: { type: "string", enum: ["campus", "home"] }, date: { type: "string", description: "YYYY-MM-DD in America/New_York" }, time: { type: "string", description: "HH:MM, 24-hour Eastern time" } }, required: ["direction", "date", "time"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input) {
        if (!input || !["campus", "home"].includes(input.direction) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time) || Number.isNaN(Date.parse(input.date + "T12:00:00Z")) || (/* @__PURE__ */ new Date(input.date + "T12:00:00Z")).toISOString().slice(0, 10) !== input.date) throw new Error("Provide a valid direction, date, and time.");
        const [h, m] = input.time.split(":").map(Number);
        setRoute("campus");
        setDirection(input.direction);
        $("planDate").value = input.date;
        $("planTime").value = input.time;
        plan = { date: input.date, minute: h * 60 + m };
        renderPlan();
        return { requiresTravelTimes: false, routeEstimateMinutes: ROUTE_MODEL.minutes, patternConfidence: ROUTE_MODEL.confidence, departures: upcoming(epoch(plan.date, plan.minute), direction, settings, 3, true).map((t) => ({ departure: new Date(t.at).toISOString(), estimated: t.estimated })), timezone: DATA.timezone };
      } })).catch(() => {
      });
    } catch {
    }
  }
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
