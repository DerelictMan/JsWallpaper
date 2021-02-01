import { remote, ipcRenderer } from "electron";
const dialog = remote.dialog;

function selectVideo() {
  let videoPath = dialog.showOpenDialogSync({
    title: "选择视频",
    buttonLabel: "确认",
    filters: [{ name: "视频", extensions: ["mp4"] }],
  });

  if (videoPath && videoPath.length > 0) {
    ipcRenderer.send("setWallpaper",videoPath[0]);
  }
}

function App() {
  return (
    <div className="App">
      <button onClick={selectVideo}>点击设置壁纸</button>
    </div>
  );
}

export default App;
