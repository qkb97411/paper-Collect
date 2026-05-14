const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { nickName: '', avatarUrl: '' }
  }

  const res = await db.collection('UserProfile').where({ openId: OPENID }).limit(1).get()
  if (!res.data || res.data.length === 0) {
    return { nickName: '', avatarUrl: '' }
  }
  const d = res.data[0]
  return {
    nickName: d.nickName != null ? String(d.nickName) : '',
    avatarUrl: d.avatarUrl != null ? String(d.avatarUrl) : ''
  }
}
