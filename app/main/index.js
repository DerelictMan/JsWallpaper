const { app, BrowserWindow } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const ipc = require("electron").ipcMain;
const { WinWin, ffi, CPP, L, NULL } = require("win-win-api");
const winFns = new WinWin().winFns();
const os = require("os");

let mainWin = null;
let wallWindow = null;
app.on("ready", () => {
  mainWin = new BrowserWindow({
    width: 300,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true, // 打开remote模块
      webSecurity: false, //可以使用本地资源
    },
  });

  if (isDev) {
    mainWin.loadURL("http://localhost:3000");
  } else {
    mainWin.loadURL(path.resolve(__dirname, "../product/build/index.html"));
  }

  mainWin.on("closed", () => {
    mainWin = null;
  });
});

ipc.on("setWallpaper", (e, args) => {
  if (!wallWindow) {
    wallWindow = new BrowserWindow({
      opacity: 0, //初始不透明
      transparent: true, //窗口透明
      frame: false, //是否显示边缘框
      fullscreen: true, //是否全屏显示
      webPreferences: {
        nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
        enableRemoteModule: true, //打开remote模块
        webSecurity: false, //可以使用本地资源
      },
    });

    wallWindow.loadURL(path.resolve(__dirname, "../renderer/wallPaper.html"));

    SetParent(wallWindow);

    wallWindow.on("close", () => {
      wallWindow = null;
    });
  }

  wallWindow.webContents.send("setVideo", args);

  wallWindow.webContents.on("did-finish-load", () => {
    wallWindow.webContents.send("setVideo", args);
  });
});

function SetParent(childWindow) {
  //壁纸句柄
  let workView = null;

  //寻找底层窗体句柄
  let Progman = winFns.FindWindowW(L("Progman"), NULL);

  //使用 0x3e8 命令分割出两个 WorkerW
  winFns.SendMessageTimeoutW(Progman, 0x052c, 0, 0, 0, 0x3e8, L("ok"));

  //创建回调函数
  const createEnumWindowProc = () =>
    ffi.Callback(CPP.BOOL, [CPP.HWND, CPP.LPARAM], (tophandle) => {
      //寻找桌面句柄
      let defview = winFns.FindWindowExW(
        tophandle,
        0,
        L("SHELLDLL_DefView"),
        NULL
      );

      // 如果找到桌面句柄再找壁纸句柄
      if (defview != NULL) {
        workView = winFns.FindWindowExW(0, tophandle, L("WorkerW"), NULL);
      }

      return true;
    });

  //遍历窗体获得窗口句柄
  winFns.EnumWindows(createEnumWindowProc(), 0);

  //获取electron的句柄
  const myAppHwnd = bufferCastInt32(childWindow.getNativeWindowHandle());

  //将buffer类型的句柄转换为数字
  function bufferCastInt32(buf) {
    return os.endianness() == "LE" ? buf.readInt32LE() : buf.readInt32BE();
  }

  //将electron窗口设置在壁纸上层
  winFns.SetParent(myAppHwnd, workView);
}
