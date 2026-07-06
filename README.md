# 咪了个咪小游戏

第一版是纯前端原型，可以直接打开 `index.html` 玩；如果浏览器限制本地图片加载，可以用下面的本地预览命令。

## 文件

- `index.html`：页面结构
- `styles.css`：界面样式
- `game.js`：关卡生成、遮挡判定、三消、道具和素材配置
- `图片/`：当前上传的正式图片
- `images/`：备用图片目录

## 本地预览

双击：

```text
start-phone.bat
```

或者命令行运行：

```bash
node preview-server.cjs
```

电脑上打开终端里显示的 `PC` 地址。手机和电脑连接同一个 Wi-Fi 后，打开终端里显示的 `Phone on same Wi-Fi` 地址。

如果别人手机打不开：

- 确认手机和电脑在同一个 Wi-Fi。
- Windows 防火墙弹窗出现时，允许 Node.js 访问“专用网络”。
- 不在同一个 Wi-Fi 的人无法直接访问局域网地址，需要把项目部署到公网。

## 给不在同一个 Wi-Fi 的人玩

这是纯静态网页项目，可以部署到 GitHub Pages、Vercel、Netlify、Cloudflare Pages 或自己的服务器。

GitHub Pages 发布后，别人可以用手机或电脑直接打开公网地址：

```text
https://你的GitHub用户名.github.io/仓库名/
```

推荐 GitHub Pages 设置：

- Repository 必须有 `main` 分支。
- Settings -> Pages -> Source 选择 `GitHub Actions`。
- 推送代码后等待 Actions 里的 `Deploy GitHub Pages` 跑完。

需要上传这些文件和文件夹：

- `index.html`
- `styles.css`
- `game.js`
- `assets/`
- `.github/`
- `.nojekyll`
- `图片/` 可以不上传，游戏实际使用的是 `assets/tiles/` 里的裁剪图。

## 图片素材

当前会从 `图片/` 文件夹读取素材，裁剪成统一的 `assets/tiles/tile-01.png` 格式，并生成 `assets/tiles/manifest.js` 供游戏使用。

重新裁剪：

```bash
python scripts/make_tiles.py
```

原图文件名和扩展名不用固定，脚本会尝试识别 `图片/` 文件夹里的所有图片，并自动生成标准 PNG 命名。
