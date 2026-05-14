const PLACEHOLDER_KEY = 'mine_placeholder_nick';
const AVATAR_KEY = 'mine_avatar';
const NICK_MAX = 16;

function genRandomNick() {
  const pool = ['灵光', '漫步', '浅眠', '晴空', '半糖', '未名', '拍拍', '相纸'];
  const a = pool[Math.floor(Math.random() * pool.length)];
  const num = String(Math.floor(100000 + Math.random() * 900000));
  return a + '玩家' + num;
}

function ensurePlaceholderNick() {
  let n = wx.getStorageSync(PLACEHOLDER_KEY);
  if (!n) {
    n = genRandomNick();
    wx.setStorageSync(PLACEHOLDER_KEY, n);
  }
  return n;
}

Page({
  data: {
    displayNickName: '',
    showNickHint: false,
    avatarUrl: '',
    nickModalVisible: false,
    nickModalInput: '',
    nickModalFocus: false,
    primaryTab: 'all',
    subTypeChips: [],
    subTypeSelected: '__all__',
    totalSpend: '0.00',
    totalStock: 0,
    loading: true,
    loadError: ''
  },

  openId: '',
  userRecords: [],
  fujiById: {},
  polaroidById: {},

  onLoad() {
    this.refreshData();
  },

  onShow() {
    this.refreshData();
  },

  noop() {},

  onAvatarError() {
    console.log('头像加载失败，清除无效链接');
    this.setData({ avatarUrl: '' });
  },

  /** 根据云端资料刷新展示；无云端昵称时用本地占位随机名 */
  applyProfileFromCloud(profile) {
    const app = getApp();
    const cloudNick = (profile && profile.nickName) || '';
    const cloudAvatar = (profile && profile.avatarUrl) || '';

    if (app && app.globalData) {
      app.globalData.userNick = cloudNick;
      app.globalData.userAvatar = cloudAvatar;
    }

    if (cloudNick) {
      wx.removeStorageSync(PLACEHOLDER_KEY);
      wx.setStorageSync(AVATAR_KEY, cloudAvatar);
      this.setData({
        displayNickName: cloudNick,
        showNickHint: false,
        avatarUrl: cloudAvatar
      });
    } else {
      const ph = ensurePlaceholderNick();
      wx.removeStorageSync('mine_nick');
      this.setData({
        displayNickName: ph,
        showNickHint: true,
        avatarUrl: cloudAvatar
      });
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail || {};
    if (!avatarUrl) return;

    wx.showLoading({ title: '保存中', mask: true });

    // 将临时文件上传到云存储，获取永久链接
    const cloudPath = 'avatars/' + (this.openId || 'unknown') + '_' + Date.now() + '.jpg';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: avatarUrl
    })
    .then((res) => {
      const fileID = res.fileID;
      // 将云存储的永久链接保存到数据库
      return wx.cloud.callFunction({
        name: 'setPlayerProfile',
        data: { avatarUrl: fileID }
      }).then(() => fileID);
    })
    .then((fileID) => {
      wx.hideLoading();
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.userAvatar = fileID;
      }
      wx.setStorageSync(AVATAR_KEY, fileID);
      this.setData({ avatarUrl: fileID });
      if (app && app.syncUserProfileToCloud) {
        app.syncUserProfileToCloud();
      }
    })
    .catch((err) => {
      wx.hideLoading();
      console.error('头像上传/保存失败', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  },

  openNicknameEditor() {
    this.setData({
      nickModalVisible: true,
      nickModalInput: this.data.displayNickName || '',
      nickModalFocus: false
    });
    setTimeout(() => {
      this.setData({ nickModalFocus: true });
    }, 120);
  },

  closeNickModal() {
    this.setData({
      nickModalVisible: false,
      nickModalFocus: false
    });
  },

  onNickModalInput(e) {
    this.setData({ nickModalInput: e.detail.value || '' });
  },

  confirmNickModal() {
    const raw = (this.data.nickModalInput || '').trim();
    if (!raw) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    if (raw.length > NICK_MAX) {
      wx.showToast({ title: '昵称过长', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '校验中', mask: true });
    wx.cloud
      .callFunction({
        name: 'setPlayerProfile',
        data: { nickName: raw }
      })
      .then((res) => {
        wx.hideLoading();
        const r = res.result || {};
        if (!r.ok && r.error === 'nickname_exists') {
          wx.showToast({ title: '用户名已存在，请重新修改', icon: 'none' });
          return;
        }
        if (!r.ok) {
          const map = {
            empty_nick: '昵称不能为空',
            nick_too_long: '昵称过长',
            no_openid: '登录异常'
          };
          wx.showToast({ title: map[r.error] || '保存失败', icon: 'none' });
          return;
        }

        wx.removeStorageSync(PLACEHOLDER_KEY);
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.userNick = raw;
        }
        wx.setStorageSync('mine_nick', raw);

        this.setData({
          displayNickName: raw,
          showNickHint: false
        });
        this.closeNickModal();
        wx.showToast({ title: '修改成功', icon: 'success' });

        if (app && app.syncUserProfileToCloud) {
          app.syncUserProfileToCloud();
        }
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('setPlayerProfile nick', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },

  setPrimaryTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab) return;
    this.setData({ primaryTab: tab, subTypeSelected: '__all__' }, () => {
      this.rebuildSubTypeChips();
      this.computeStats();
    });
  },

  setSubType(e) {
    const value = e.currentTarget.dataset.value;
    if (value === undefined) return;
    this.setData({ subTypeSelected: value }, () => this.computeStats());
  },

  rebuildSubTypeChips() {
    const { primaryTab } = this.data;
    if (primaryTab === 'all') {
      this.setData({ subTypeChips: [] });
      return;
    }

    const source = primaryTab === 'fuji' ? this.fujiById : this.polaroidById;
    const seen = new Set();
    const chips = [{ label: '全部', value: '__all__' }];
    Object.values(source).forEach((row) => {
      const st = row.subType != null ? String(row.subType) : '';
      if (!st || seen.has(st)) return;
      seen.add(st);
      chips.push({ label: st, value: st });
    });
    this.setData({ subTypeChips: chips });
  },

  refreshData() {
    if (!wx.cloud || !wx.cloud.database()) {
      this.setData({
        loading: false,
        loadError: '云服务未初始化'
      });
      return;
    }

    this.setData({ loading: true, loadError: '' });

    wx.cloud
      .callFunction({ name: 'login' })
      .then((res) => {
        const openId = res.result.openid;
        const unionId = res.result.unionid || '';
        if (!openId) throw new Error('未获取到 openId');
        this.openId = openId;
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.openId = openId;
          app.globalData.unionId = unionId;
        }
        const db = wx.cloud.database();
        return Promise.all([
          wx.cloud.callFunction({ name: 'getPlayerProfile' }),
          db.collection('FujiConfig').get(),
          db.collection('PolaroidConfig').get(),
          db.collection('UserPaperData').where({ _openid: openId }).get()
        ]);
      })
      .then(([profileRes, fujiRes, polaroidRes, userRes]) => {
        const prof = (profileRes && profileRes.result) || {};
        this.applyProfileFromCloud(prof);

        this.fujiById = {};
        (fujiRes.data || []).forEach((doc) => {
          if (doc._id) this.fujiById[doc._id] = doc;
        });
        this.polaroidById = {};
        (polaroidRes.data || []).forEach((doc) => {
          if (doc._id) this.polaroidById[doc._id] = doc;
        });
        this.userRecords = userRes.data || [];
        this.rebuildSubTypeChips();
        this.computeStats();
        this.setData({ loading: false });

        const app = getApp();
        if (app && app.syncUserProfileToCloud) {
          app.syncUserProfileToCloud();
        }
      })
      .catch((err) => {
        console.error('MyHome 加载失败', err);
        this.setData({
          loading: false,
          loadError: '数据加载失败，请稍后重试'
        });
      });
  },

  resolveBrand(record) {
    if (record.paperBrand === 'fuji' || record.paperBrand === 'polaroid') {
      return record.paperBrand;
    }
    if (record.paperId && this.fujiById[record.paperId]) return 'fuji';
    if (record.paperId && this.polaroidById[record.paperId]) return 'polaroid';
    return '';
  },

  resolveSubType(record) {
    if (record.paperSubType) return String(record.paperSubType);
    if (record.paperId && this.fujiById[record.paperId]) {
      const st = this.fujiById[record.paperId].subType;
      return st != null ? String(st) : '';
    }
    if (record.paperId && this.polaroidById[record.paperId]) {
      const st = this.polaroidById[record.paperId].subType;
      return st != null ? String(st) : '';
    }
    return '';
  },

  computeStats() {
    const { primaryTab, subTypeSelected } = this.data;
    let rows = (this.userRecords || []).filter((r) => r.paperId);

    rows = rows.filter((r) => {
      const brand = this.resolveBrand(r);
      if (primaryTab === 'all') return true;
      if (primaryTab === 'fuji') return brand === 'fuji';
      if (primaryTab === 'polaroid') return brand === 'polaroid';
      return true;
    });

    if (primaryTab !== 'all' && subTypeSelected && subTypeSelected !== '__all__') {
      rows = rows.filter((r) => this.resolveSubType(r) === subTypeSelected);
    }

    let spend = 0;
    let stock = 0;
    rows.forEach((r) => {
      const c = parseInt(r.ownCount, 10);
      stock += Number.isNaN(c) ? 0 : Math.max(0, c);
      (r.paperFormList || []).forEach((box) => {
        const p = parseFloat(box.price);
        if (!Number.isNaN(p)) spend += p;
      });
    });

    this.setData({
      totalSpend: spend.toFixed(2),
      totalStock: stock
    });
  }
});
