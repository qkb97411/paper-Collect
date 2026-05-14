const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const NICK_MAX = 16

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { ok: false, error: 'no_openid' }
  }

  const hasNick = event && Object.prototype.hasOwnProperty.call(event, 'nickName')
  const hasAvatar = event && Object.prototype.hasOwnProperty.call(event, 'avatarUrl')

  if (!hasNick && !hasAvatar) {
    return { ok: false, error: 'no_fields' }
  }

  let nickName
  if (hasNick) {
    nickName = String(event.nickName == null ? '' : event.nickName).trim()
    if (!nickName) {
      return { ok: false, error: 'empty_nick' }
    }
    if (nickName.length > NICK_MAX) {
      return { ok: false, error: 'nick_too_long' }
    }
    const dup = await db.collection('UserProfile').where({ nickName }).get()
    const taken = (dup.data || []).some((d) => d.openId && d.openId !== OPENID)
    if (taken) {
      return { ok: false, error: 'nickname_exists' }
    }
  }

  const mine = await db.collection('UserProfile').where({ openId: OPENID }).limit(1).get()
  const now = db.serverDate()

  if (!mine.data || mine.data.length === 0) {
    const doc = {
      openId: OPENID,
      nickName: hasNick ? nickName : '',
      avatarUrl: hasAvatar ? String(event.avatarUrl || '') : '',
      createTime: now,
      updateTime: now
    }
    await db.collection('UserProfile').add({ data: doc })
    return { ok: true }
  }

  const id = mine.data[0]._id
  const patch = { updateTime: now }
  if (hasNick) patch.nickName = nickName
  if (hasAvatar) patch.avatarUrl = String(event.avatarUrl || '')

  await db.collection('UserProfile').doc(id).update({ data: patch })
  return { ok: true }
}
