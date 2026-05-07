# koishi-plugin-mc-login

[![npm](https://img.shields.io/npm/v/koishi-plugin-mc-login?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-mc-login)

一款用于绑定qq号和mc的koishi插件

> [!warning]
> 该插件断开服务器连接后将无法阻止用户进入服务器，因此**请确保您的网络环境安全稳定（例如仅本机或内网）**

> [!NOTE]
> 该插件正在制作新版本，将采用白名单功能实现

## 配置插件

配置插件时，需要填写以下内容：
- rconHost：rcon主机地址，默认值为localhost
- rconPort：rcon端口号，默认值为25575
- rconPassword：rcon密码，默认值为空
- playerListUpdateInterval：玩家列表更新间隔，单位为毫秒，默认值为500
- verifyTimeout：验证超时时间，单位为毫秒，默认值为60000

## 使用方法

1. 玩家进入服务器会被踢出并提示验证码
2. 玩家需在qq中对机器人发送验证码，格式为`mcl bind <验证码>`
3. 验证码正确将会提示确认信息，输入`确认`后，玩家将被绑定到该qq号
4. 玩家后续将会被自动允许进入服务器。建议与其他插件配合使用例如[EasyAuth](https://www.mcmod.cn/class/6241.html)

## 其他功能
### 0.1.0及以后版本可用
- 玩家可以通过发送`mcl unbind`解绑账号
- 玩家可以通过发送`mcl list`查看当前绑定的mc账号
