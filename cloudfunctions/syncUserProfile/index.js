const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 在服务端批量写入昵称、头像、unionId，不受客户端数据库「自定义安全规则」限制。
 * 身份仅信任 cloud.getWXContext().OPENID，不信任客户端传入的 openId。
 */
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const OPENID = wxContext.OPENID
  const UNIONID = wxContext.UNIONID || ''

  const nickName = typeof event.nickName === 'string' ? event.nickName : ''
  const avatarUrl = typeof event.avatarUrl === 'string' ? event.avatarUrl : ''

  if (!OPENID) {
    return { ok: false, error: 'missing OPENID', updated: 0 }
  }

  const _ = db.command
  let list = []

  try {
    const res = await db
      .collection('UserPaperData')
      .where(_.or([{ openId: OPENID }, { _openid: OPENID }]))
      .get()
    list = res.data || []
  } catch (e) {
    try {
      const res2 = await db.collection('UserPaperData').where({ openId: OPENID }).get()
      list = res2.data || []
    } catch (e2) {
      console.error('syncUserProfile query failed', e, e2)
      return { ok: false, error: String(e2 && e2.message ? e2.message : e2), updated: 0 }
    }
  }

  if (list.length === 0) {
    return { ok: true, updated: 0, message: 'no documents for this user' }
  }

  const patch = {
    openId: OPENID,
    nickName,
    avatarUrl,
    unionId: UNIONID,
    profileUpdateTime: db.serverDate()
  }

  let updated = 0
  for (const doc of list) {
    if (!doc._id) continue
    try {
      await db.collection('UserPaperData').doc(doc._id).update({
        data: patch
      })
      updated += 1
    } catch (err) {
      console.error('syncUserProfile update doc failed', doc._id, err)
    }
  }

  return { ok: true, updated, total: list.length }
}
