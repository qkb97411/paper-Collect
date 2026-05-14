// app.js
// 与「我的」页一致，用于把展示用昵称、头像同步到云库
const STORAGE_USER_NICK = 'mine_nick'
const STORAGE_USER_AVATAR = 'mine_avatar'

App({
  onLaunch() {
    console.log("🚀 小程序启动")

    if (!wx.cloud) {
      console.error('请升级基础库')
    } else {
      wx.cloud.init({
        env: "cloud1-d1gwt1b3t500f1304",
        traceUser: true
      })
    }

    this.autoLogin()
  },

  globalData: {
    openId: null,
    unionId: '',
    userNick: '',
    userAvatar: ''
  },

  // 自动登录
  autoLogin() {
    const that = this
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      console.log("✅ 云函数完整返回结果：", JSON.stringify(res)); // 打印完整结果
      const openId = res.result.openid
      const unionId = res.result.unionid || ''
      if (!openId) {
        console.error("❌ openId 获取失败，result内容：", res.result);
        return
      }
      that.globalData.openId = openId
      that.globalData.unionId = unionId
      that
        .saveUser(openId, unionId)
        .finally(() =>
          that.loadPlayerProfile().finally(() => that.syncUserProfileToCloud())
        )
    }).catch(err => {
      console.error("❌ 登录失败", err)
    })
  },

  /** 从云库 UserProfile 拉取昵称、头像，供详情页同步与「我的」展示 */
  loadPlayerProfile() {
    if (!wx.cloud) return Promise.resolve()
    return wx.cloud
      .callFunction({ name: 'getPlayerProfile' })
      .then((res) => {
        const r = res.result || {}
        this.globalData.userNick = r.nickName != null ? String(r.nickName) : ''
        this.globalData.userAvatar = r.avatarUrl != null ? String(r.avatarUrl) : ''
        if (this.globalData.userNick) {
          wx.setStorageSync(STORAGE_USER_NICK, this.globalData.userNick)
        }
        if (this.globalData.userAvatar) {
          wx.setStorageSync(STORAGE_USER_AVATAR, this.globalData.userAvatar)
        }
      })
      .catch((err) => {
        console.warn('loadPlayerProfile', err)
      })
  },

  getUserDisplayProfile() {
    const gNick = this.globalData.userNick
    const gAvatar = this.globalData.userAvatar
    const nick =
      gNick != null && gNick !== ''
        ? gNick
        : wx.getStorageSync(STORAGE_USER_NICK) || ''
    const avatar =
      gAvatar != null && gAvatar !== ''
        ? gAvatar
        : wx.getStorageSync(STORAGE_USER_AVATAR) || ''
    return { nickName: nick, avatarUrl: avatar }
  },

  /**
   * 昵称 / 头像同步：走云函数 syncUserProfile，服务端更新不受客户端库「自定义权限」拦截。
   * 部署：cloudfunctions/syncUserProfile 右键「上传并部署：云端安装依赖」
   */
  syncUserProfileToCloud() {
    const openId = this.globalData.openId
    if (!openId) return Promise.resolve()

    const { nickName, avatarUrl } = this.getUserDisplayProfile()

    return wx.cloud
      .callFunction({
        name: 'syncUserProfile',
        data: {
          nickName,
          avatarUrl
        }
      })
      .then((res) => {
        const r = res.result || {}
        if (r.ok) {
          console.log('✅ 用户展示信息已同步（云函数）', r)
        } else {
          console.warn('⚠️ syncUserProfile', r)
        }
      })
      .catch((err) => {
        console.error('❌ syncUserProfileToCloud 失败（是否已部署云函数 syncUserProfile？）', err)
      })
  },

  // 首次登录时写入一条占位记录；使用 _openid 与权限规则匹配
  saveUser(openId, unionId) {
    const db = wx.cloud.database()
    const { nickName, avatarUrl } = this.getUserDisplayProfile()

    return db
      .collection('UserPaperData')
      .where({ _openid: openId })
      .get()
      .then((res) => {
        if ((res.data || []).length > 0) {
          console.log('✅ 用户数据已存在，跳过占位写入')
          return
        }
        return db.collection('UserPaperData').add({
          data: {
            openId: openId,
            unionId: unionId || '',
            nickName,
            avatarUrl,
            createTime: new Date()
          }
        })
      })
      .then((addRes) => {
        if (addRes) console.log('✅ 用户占位记录已写入 UserPaperData')
      })
      .catch((err) => {
        console.error('❌ saveUser 失败（云函数 openid、或库权限、或字段规则）', err)
      })
  }
})