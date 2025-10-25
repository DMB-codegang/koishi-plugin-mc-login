import { Context, } from 'koishi'
import { Config } from './config'

import { rcon } from './rcon'
import { VerifyingSystem } from './verifyingSystem'

export const name = 'mc-login'
export * from './config'

let rconClient: rcon
import { database } from './database'

interface mcl {
  playerID: string
  playerName: string
  lastLoginTime: number
}
declare module 'koishi' {
  interface Tables {
    mcl: mcl
  }
}

export const inject = {
  required: ['database']
}

export function apply(ctx: Context, config: Config) {
  const db = new database(ctx)
  const logger = ctx.logger('mc-login')
  rconClient = new rcon(ctx, config)

  // 注册玩家列表变动事件监听器
  rconClient.onPlayerListChange((oldPlayers, newPlayers) => {
    // 更新玩家列表显示

    // 检测玩家离开
    const leftPlayers = oldPlayers.filter(player => !newPlayers.includes(player))
    if (leftPlayers.length > 0) {
      logger.info('玩家 %s 已离开服务器', leftPlayers.join(', '))
    }

    // 检测玩家加入
    const joinedPlayers = newPlayers.filter(player => !oldPlayers.includes(player))
    if (joinedPlayers.length > 0) {
      console.log(joinedPlayers)
      // 检查玩家是否已注册
      // 在玩家加入处理中添加错误处理和状态检查
      joinedPlayers.forEach(async player => {
        try {
          // 检查玩家是否仍在服务器中
          if (!newPlayers.includes(player)) {
            return // 玩家已经离开，不处理
          }
          
          const playerID = await db.getPlayerID(player)
          if (playerID === null) {
            // 再次检查玩家是否仍在服务器中
            if (!newPlayers.includes(player)) {
              return // 玩家已经离开，不发送验证码
            }
            const verifyCode = VerifyingSystem.addVerifyingUser(ctx, player, config.verifyTimeout)
            await rconClient.kickPlayer(player, '请先绑定账号，验证码：' + verifyCode.code)
            logger.info('玩家 %s 未注册，已发送验证码 %s', player, verifyCode.code)
          } else {
            logger.info('玩家 %s 已加入服务器', player)
          }
        } catch (error) {
          logger.error('处理玩家 %s 时发生错误：%s', player, error.message)
        }
      })
    }
  })

  ctx.on('dispose', () => {
    // 在插件停用时关闭 rcon 连接
    rconClient.close()
  })

  ctx.command('mcl bind <code>')
    .action(async ({ session }, _, code) => {
      const player = VerifyingSystem.verifyUser(Number(code))
      if (player) {
        // 确认绑定
        session.send('【警告】您正在绑定账号操作\n是否确认绑定账号 ' + player.playerName + '？\n输入“确认”以绑定，其他任意内容取消绑定')
        const confirm = await session.prompt(60000)
        if (!confirm || !(confirm == '确认' || confirm == '“确认”')) {
          return '绑定已取消'
        }
        await db.register(session.userId, player.playerName)
        session.send('玩家 ' + player.playerName + ' 已成功绑定账号')
      } else {
        session.send('验证码无效')
      }
    })
}
