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
  lastLoginTime: Date
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
            const verifyCode = VerifyingSystem.addVerifyingUser(ctx, player, config.verifyTimeout, logger)
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

  // 绑定账号
  ctx.command('mcl.bind <code>')
    .action(async ({ session }, code) => {
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
        logger.info('玩家 %s 已成功绑定账号', player.playerName)
      } else {
        session.send('验证码无效')
      }
    })

    // 查看绑定账号列表
  ctx.command('mcl.list')
    .action(async ({ session }) => {
      const playerNames = await db.getPlayerName(session.userId)
      if (playerNames.length > 0) {
        session.send('您绑定的账号有：' + playerNames.join(', '))
      } else {
        session.send('您未绑定任何账号')
      }
    })

    // 解绑账号
    ctx.command('mcl.unbind <playerName>')
      .action(async ({ session }, playerName) => {
        // 检查玩家是否绑定了该账号
        const playerID = await db.getPlayerID(playerName)
        if (playerID !== session.userId) {
          return '您未绑定该账号'
        }
        await session.send('【警告】您正在解绑账号操作\n是否确认解绑账号 ' + playerName + '？\n输入“确认”以解绑，其他任意内容取消解绑')
        const confirm = await session.prompt(60000)
        if (!confirm || !(confirm == '确认' || confirm == '“确认”')) {
          return '解绑已取消'
        }
        const result = await db.unbind(playerName)
        if (result == 'success') {
          session.send('您的账号已成功解绑')
        } else {
          session.send('解绑失败')
        }
      })

      // ctx.command('mcl.rp <playerName>')
      //   .action(async ({ session }, playerName) => {
      //     // 检查玩家是否绑定了该账号
      //     const playerID = await db.getPlayerID(playerName)
      //     if (playerID !== session.userId) {
      //       return '您未绑定该账号'
      //     }
      //     await rconClient.resetPassword(playerName, password)
      //     session.send('账号 ' + playerName + ' 的密码已成功重置')
      //   })
}