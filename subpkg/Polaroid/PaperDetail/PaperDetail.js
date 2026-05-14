const db = wx.cloud.database();
const _ = db.command;

function getCloudUserProfile() {
  const app = getApp()
  const base =
    app && typeof app.getUserDisplayProfile === 'function'
      ? app.getUserDisplayProfile()
      : { nickName: '', avatarUrl: '' }
  return {
    nickName: base.nickName || '',
    avatarUrl: base.avatarUrl || '',
    unionId: (app && app.globalData && app.globalData.unionId) || ''
  }
}

const DEFAULT_BOX = () => ({
  code: '',
  date: '',
  price: '',
  used: false
});

Page({
  data: {
    paperData: {},
    paperBrand: 'polaroid',
    paperSubType: '',
    toggleChecked: false,
    ownCount: 0,
    paperFormList: [],
    paperId: '',
    openId: '',
    isOpen: false,
    isPressed: false,
    isPreview: false,
    previewUrl: '',
    activeScrollTarget: '',
    keyboardHeight: 0
  },

  onLoad(options) {
    const { id } = options;
    if (!id) return;

    this.setData({ paperId: id });

    this.getUserOpenId(() => {
      this.getPaperDetail(id);
      this.loadUserPaperDataFromCloud(id);
    });
  },

  getUserOpenId(callback) {
    wx.cloud
      .callFunction({ name: 'login' })
      .then((res) => {
        const openId = res.result.openid;
        this.setData({ openId });
        callback();
      })
      .catch((err) => {
        console.error('获取 openId 失败', err);
        callback();
      });
  },

  normalizeFormList(list) {
    return (list || []).map((item) => ({
      code: item.code != null ? String(item.code) : '',
      date: item.date != null ? String(item.date) : '',
      price: item.price != null ? String(item.price) : '',
      used: !!item.used
    }));
  },

  loadUserPaperDataFromCloud(paperId) {
    const { openId } = this.data;
    if (!openId) return;

    db.collection('UserPaperData')
      .where({
        _openid: openId,
        paperId: _.exists(true)
      })
      .get()
      .then((res) => {
        const existingDoc = (res.data || []).find(doc => doc.paperId === paperId);
        if (existingDoc) {
          this.setData({
            toggleChecked: existingDoc.ownStatus || false,
            ownCount: existingDoc.ownCount || 0,
            paperFormList: this.normalizeFormList(existingDoc.paperFormList)
          });
        }
      });
  },

  saveDataToCloud() {
    const { openId, paperId, paperBrand, paperSubType, toggleChecked, ownCount, paperFormList } =
      this.data;
    if (!openId || !paperId) return;

    const profile = getCloudUserProfile()
    const userPaperData = {
      paperId,
      paperBrand,
      paperSubType: paperSubType || '',
      ownStatus: toggleChecked,
      ownCount,
      paperFormList: this.normalizeFormList(paperFormList),
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl,
      unionId: profile.unionId,
      updateTime: new Date()
    };

    db.collection('UserPaperData')
      .where({
        _openid: openId,
        paperId: _.exists(true)
      })
      .get()
      .then((res) => {
        const existingDoc = (res.data || []).find(doc => doc.paperId === paperId);
        if (existingDoc) {
          return db.collection('UserPaperData').doc(existingDoc._id).update({
            data: userPaperData
          });
        } else {
          return db.collection('UserPaperData').add({
            data: userPaperData
          });
        }
      })
      .catch((err) => {
        console.error('saveDataToCloud 失败', err);
      });
  },

  onToggleChange(e) {
    const checked = e.detail.checked;
    this.setData({ toggleChecked: checked }, () => this.saveDataToCloud());
  },

  resizeFormList(count) {
    const n = Math.max(0, parseInt(count, 10) || 0);
    let list = (this.data.paperFormList || []).slice(0, n);
    while (list.length < n) {
      list.push(DEFAULT_BOX());
    }
    return list;
  },

  onOwnCountInput(e) {
    const raw = e.detail.value;
    let count = parseInt(raw, 10);
    if (Number.isNaN(count) || count < 0) count = 0;
    const list = this.resizeFormList(count);
    this.setData({ ownCount: count, paperFormList: list }, () => this.saveDataToCloud());
  },

  updateBoxField(index, key, value) {
    const list = (this.data.paperFormList || []).map((row, i) =>
      i === index ? { ...row, [key]: value } : row
    );
    this.setData({ paperFormList: list });
  },

  scrollInputIntoView(target) {
    if (!target) return;

    wx.nextTick(() => {
      wx.createSelectorQuery()
        .select(`#${target}`)
        .boundingClientRect()
        .selectViewport()
        .scrollOffset()
        .exec((res) => {
          const rect = res && res[0];
          const viewport = res && res[1];
          if (!rect || !viewport) return;

          wx.pageScrollTo({
            scrollTop: Math.max(0, viewport.scrollTop + rect.top - 96),
            duration: 200
          });
        });
    });
  },

  onInputFocus(e) {
    const target = e.currentTarget.dataset.scrollTarget;
    this.setData({ activeScrollTarget: target || '' });
  },

  onInputBlur() {
    this.setData({ keyboardHeight: 0 });
  },

  onKeyboardHeightChange(e) {
    const height = Math.max(0, e.detail.height || 0);
    const target = e.currentTarget.dataset.scrollTarget || this.data.activeScrollTarget;
    this.setData(
      {
        keyboardHeight: height,
        activeScrollTarget: target || ''
      },
      () => this.scrollInputIntoView(target)
    );
  },

  onBoxCodeInput(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.updateBoxField(index, 'code', e.detail.value);
  },

  onBoxDateInput(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.updateBoxField(index, 'date', e.detail.value);
  },

  onBoxPriceInput(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    this.updateBoxField(index, 'price', e.detail.value);
  },

  onBoxUsedChange(e) {
    const index = e.detail.boxIndex;
    const checked = e.detail.checked;
    if (index == null || index < 0) return;
    this.updateBoxField(index, 'used', checked);
  },

  onSaveBox(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (index == null || index < 0) return;
    const { openId, paperId, paperBrand, paperSubType, toggleChecked, ownCount, paperFormList } =
      this.data;
    if (!openId || !paperId) return;

    const profile = getCloudUserProfile();
    const userPaperData = {
      paperId,
      paperBrand,
      paperSubType: paperSubType || '',
      ownStatus: toggleChecked,
      ownCount,
      paperFormList: this.normalizeFormList(paperFormList),
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl,
      unionId: profile.unionId,
      updateTime: new Date()
    };

    wx.showLoading({ title: '保存中...' });

    db.collection('UserPaperData')
      .where({
        _openid: openId,
        paperId: _.exists(true)
      })
      .get()
      .then((res) => {
        const existingDoc = (res.data || []).find(doc => doc.paperId === paperId);
        if (existingDoc) {
          return db.collection('UserPaperData').doc(existingDoc._id).update({
            data: userPaperData
          });
        } else {
          return db.collection('UserPaperData').add({
            data: userPaperData
          });
        }
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '保存成功', icon: 'success' });
      })
      .catch((err) => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },

  getPaperDetail(id) {
    db.collection('PolaroidConfig')
      .doc(id)
      .get()
      .then((res) => {
        const subType = res.data.subType != null ? String(res.data.subType) : '';
        this.setData({
          paperData: res.data,
          paperSubType: subType
        });
      });
  },

  togglePaperBox() {
    this.setData({ isOpen: !this.data.isOpen });
  },

  onPressStart() {
    this.setData({ isPressed: true });
  },

  onPressEnd() {
    this.setData({ isPressed: false });
  },

  previewCard(e) {
    const url = e.currentTarget.dataset.src;
    if (!url) return;
    this.setData({ isPreview: true, previewUrl: url });
  },

  closePreview() {
    this.setData({ isPreview: false, previewUrl: '' });
  },

  noop() {}
});
