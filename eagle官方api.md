# event（事件）

## onPluginCreate(callback) <a href="#gylpl" id="gylpl"></a>

插件窗口建立时，Eagle 会主动调用这个方法，你可以使用此方法初始化插件需要的模块。

- `callback` Function
  - `plugin` Object - 插件属性
    - `manifest` Object - 插件 manifest.json 完整配置。
    - `path` String - 插件所在路径

```javascript
eagle.onPluginCreate((plugin) => {
  console.log(plugin.manifest.name);
  console.log(plugin.manifest.version);
  console.log(plugin.manifest.logo);
  console.log(plugin.path);
});
```

{% hint style="info" %}
提示：如果插件不需要 manifest 信息就可以运行，那么你也可以使用 `window.onload` 来进行开发。
{% endhint %}

## onPluginRun(callback) <a href="#gylpl" id="gylpl"></a>

当用户点击插件面板的插件时，Eagle 会主动调用这个方法。

- `callback` Function

```javascript
eagle.onPluginRun(() => {
  console.log("eagle.onPluginRun");
});
```

## onPluginBeforeExit(callback) <a href="#z1a5y" id="z1a5y"></a>

插件窗口关闭前 Eagle 会主动调用这个方法。

- `callback` Function

```javascript
eagle.onPluginBeforeExit(() => {
  console.log("插件将退出");
});

// 阻止窗口关闭
window.onbeforeunload = (event) => {
  return (event.returnValue = false);
};
```

{% hint style="info" %}
提示：如果你想要阻止窗口被关闭，你可以注册 `window.onbeforeunload`方法避免窗口被关闭。
{% endhint %}

## onPluginShow(callback) <a href="#w2vxi" id="w2vxi"></a>

插件窗口显示时时，Eagle 会主动调用这个方法。

- `callback` Function

```javascript
eagle.onPluginShow(() => {
  console.log("插件窗口显示");
});
```

## onPluginHide(callback) <a href="#zgvst" id="zgvst"></a>

插件窗口隐藏时时，Eagle 会主动调用这个方法。

- `callback` Function

```javascript
eagle.onPluginHide(() => {
  console.log("插件窗口隐藏");
});
```

## onLibraryChanged(callback) <a href="#g3tny" id="g3tny"></a>

当用户切换资源库时，Eagle 会主动调用这个方法。

- `callback` Function
  - `libraryPath` String - 当前资源库路径。

```javascript
eagle.onLibraryChanged((libraryPath) => {
  console.log(`侦测到资源库切换，新的资源库路径: ${libraryPath}`);
});
```

{% hint style="info" %}
提示：如果你需要获取更完整的资源库信息，你可以使用 `eagle.library.info()` 方法取得。
{% endhint %}

{% hint style="warning" %}
**注意：** 如果插件执行过程必须依赖相对的资源库路径，你可能需要透过注册此方法，在资源库切换时，做出对应的调整，避免程序执行过程发生错误。
{% endhint %}

## onThemeChanged(callback) <a href="#xlf6z" id="xlf6z"></a>

Eagle 主程序主题配色改变是，Eagle 会主动调用这个方法，如果插件支持多种配色主题，你可以使用此方法做出对应的 UI 调整。

- `callback` Function
  - `theme` String - 当前主题配色的名称，如 `Auto`、`LIGHT`、`LIGHTGRAY`、`GRAY`、`DARK`、`BLUE`、`PURPLE`。

```javascript
eagle.onThemeChanged((theme) => {
  console.log(`配色主题以改为: ${theme}`);
});
```

### &#x20;<a href="#nptwx" id="nptwx"></a>

# item（项目）

```javascript
eagle.onPluginCreate(async (plugin) => {
  // 取得 Eagle 应用当前被选中的文件
  let items = await eagle.item.getSelected();
  let item = items[0];

  // 修改属性
  item.name = "New Name";
  item.tags = ["tag1", "tag2"];

  // 保存修改
  await item.save();
});
```

{% hint style="success" %}
**🦄 最佳实践：** 为了确保数据安全性，请使用 `item` API 提供的 `save()` 方法进行数据的存取与修改，应避免直接修改 Eagle 资源库底下的 `metadata.json` 或任意文件。
{% endhint %}

---

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## get(options) <a href="#bdcw2" id="bdcw2"></a>

万用搜索方法，可获取指定条件的文件。

- `options` Object - 查询条件
  - `id` string (可选) - 文件 id
  - `ids` string\[] (可选) - 文件 id 数组
  - `isSelected` boolean (可选) - 正在被选中的文件
  - `isUntagged` boolean (可选) - 尚未标签
  - `isUnfiled` boolean (可选) - 尚未分类
  - `keywords` string\[] (可选) - 包含关键字
  - `tags` string\[] (可选) - 包含标签
  - `folders` string\[] (可选) - 包含文件夹
  - `ext` string (可选) - 格式
  - `annotation` string (可选) - 注释
  - `rating` Interger (可选) - 评分，`0 ~ 5`
  - `url` string (可选) - 来源链接
  - `shape` string (可选) - 形状，`square`、`portrait`、`panoramic-portrait`、`landscape`、`panoramic-landscape`
  - `fields` string\[] (可选) - 指定返回的字段，仅返回需要的数据以提升性能
- 返回 `Promise<items: Item[]>` - `items` 查询结果

```javascript
let items = await eagle.item.get({
  ids: [],
  isSelected: true,
  isUnfiled: true,
  isUntagged: true,
  keywords: [""],
  ext: "",
  tags: [],
  folders: [],
  shape: "square",
  rating: 5,
  annotation: "",
  url: "",
});

let selected = await eagle.item.get({
  isSelected: true,
});

let jpgs = await eagle.item.get({
  ext: "jpg",
});

// 仅获取特定字段以提升性能
let itemsWithFields = await eagle.item.get({
  tags: ["Design"],
  fields: ["id", "name", "tags", "modifiedAt"],
});
```

{% hint style="info" %}
提示：使用 `fields` 参数可以显著提升性能，特别是在处理大量文件时只需要部分信息的场景。
{% endhint %}

---

## getAll() <a href="#na8ve" id="na8ve"></a>

返回所有文件

- 返回 `Promise<items: Item[]>` - `items` 所有文件

```javascript
let items = await eagle.item.getAll();
console.log(items);
```

{% hint style="success" %}
**🦄 最佳实践：** 如果资源库文件数量非常多（例：20W+），避免无限制的呼叫此方法，避免造成应用性能的降低。
{% endhint %}

---

## getById(itemId) <a href="#katrb" id="katrb"></a>

返回指定 ID 之文件

- `itemId` string
- 返回 `Promise<item: Item>` - `item` 对应 ID 的文件

```javascript
let item = await eagle.item.getById("item_id");
console.log(item);
```

## getByIds(itemIds) <a href="#by1ek" id="by1ek"></a>

返回指定 IDs 之文件

- `itemIds` string\[]
- 返回 `Promise<items: Item[]>` - `items` 对应 IDs 的文件

```javascript
let items = await eagle.item.getByIds(["item_id_1", "item_id_2"]);
console.log(items);
```

---

## getSelected() <a href="#ffgvj" id="ffgvj"></a>

返回应用当前选中的文件

- 返回 `Promise<items: Item[]>` - `items` 选中之文件

```javascript
let selected = await eagle.item.getSelected();
console.log(selected);
```

---

## getIdsWithModifiedAt() <a href="#getidswithmodifiedat" id="getidswithmodifiedat"></a>

快速获取所有文件的 ID 和最后修改时间

- 返回 `Promise<items: Object[]>` - 包含 `id` 和 `modifiedAt` 的对象数组

```javascript
let idsWithTime = await eagle.item.getIdsWithModifiedAt();
console.log(idsWithTime);
// 输出示例：
// [
//   { id: "ITEM_ID_1", modifiedAt: 1625123456789 },
//   { id: "ITEM_ID_2", modifiedAt: 1625123456790 },
//   ...
// ]

// 可用于增量同步或检测文件变化
let changedItems = idsWithTime.filter((item) => item.modifiedAt > lastSyncTime);
```

{% hint style="info" %}
提示：此方法专门优化用于获取文件 ID 和修改时间，比使用 `get()` 方法获取完整数据要快得多。
{% endhint %}

---

## count(options) <a href="#count" id="count"></a>

计算符合条件的文件数量，支持与 `get()` 方法相同的查询条件。

- `options` Object - 查询条件（与 `get()` 方法相同）
  - `id` string (可选) - 文件 id
  - `ids` string\[] (可选) - 文件 id 数组
  - `isSelected` boolean (可选) - 正在被选中的文件
  - `isUntagged` boolean (可选) - 尚未标签
  - `isUnfiled` boolean (可选) - 尚未分类
  - `keywords` string\[] (可选) - 包含关键字
  - `tags` string\[] (可选) - 包含标签
  - `folders` string\[] (可选) - 包含文件夹
  - `ext` string (可选) - 格式
  - `annotation` string (可选) - 注释
  - `rating` Interger (可选) - 评分，`0 ~ 5`
  - `url` string (可选) - 来源链接
  - `shape` string (可选) - 形状，`square`、`portrait`、`panoramic-portrait`、`landscape`、`panoramic-landscape`
- 返回 `Promise<count: number>` - `count` 符合条件的文件数量

```javascript
// 计算 JPG 格式文件数量
let jpgCount = await eagle.item.count({
  ext: "jpg",
});

// 计算带有特定标签的文件数量
let taggedCount = await eagle.item.count({
  tags: ["Design", "Illustration"],
});

// 计算未分类文件数量
let unfiledCount = await eagle.item.count({
  isUnfiled: true,
});
```

{% hint style="info" %}
提示：当只需要获取文件数量时，使用 `count()` 比 `get()` 性能更好。
{% endhint %}

---

## countAll() <a href="#countall" id="countall"></a>

快速返回资源库中所有文件的总数

- 返回 `Promise<count: number>` - `count` 所有文件数量

```javascript
let totalCount = await eagle.item.countAll();
console.log(`资源库共有 ${totalCount} 个文件`);
```

{% hint style="info" %}
提示：`countAll()` 针对性能进行了优化，比 `getAll()` 后计算数组长度要快得多。
{% endhint %}

---

## countSelected() <a href="#countselected" id="countselected"></a>

返回应用当前选中的文件数量

- 返回 `Promise<count: number>` - `count` 选中的文件数量

```javascript
let selectedCount = await eagle.item.countSelected();
console.log(`当前选中了 ${selectedCount} 个文件`);
```

---

## select(itemIds) <a href="#select" id="select"></a>

选中指定的文件

- `itemIds` string\[] - 要选中的文件 ID 数组
- 返回 `Promise<result: boolean>` - `result` 是否选中成功

```javascript
// 选中单个文件
await eagle.item.select(["ITEM_ID_1"]);

// 选中多个文件
await eagle.item.select(["ITEM_ID_1", "ITEM_ID_2", "ITEM_ID_3"]);

// 清空选中
await eagle.item.select([]);
```

{% hint style="info" %}
提示：调用此方法会替换当前的选中状态，而不是追加到现有选中项。
{% endhint %}

{% hint style="info" %}
提示：`select()` 方法需要 Eagle 4.0 build12 以上版本支持。
{% endhint %}

---

## addFromURL(url, options) <a href="#tg9ak" id="tg9ak"></a>

将图片链接添加至 Eagle

- `url`string - 欲添加图片链接，支持 `http`、 `https`、 `base64`
- `options` Object
  - `name` string (可选) - 文件名
  - `website` string (可选) - 来源网址
  - `tags` string\[] (可选) - 标签
  - `folders` string\[] (可选) - 所属文件夹 IDs
  - `annotation` string (可选) - 注释
- 返回 `Promise<itemId: string>` - `itemId`成功创建的项目 ID

```javascript
const imgURL =
  "https://cdn.dribbble.com/userupload/3885520/file/original-ee68b80a6e10edab6f192e1e542da6ed.jpg";
const itemId = await eagle.item.addFromURL(imgURL, {
  name: "Camping",
  website: "https://dribbble.com/shots/19744134-Camping-2",
  tags: ["Dribbble", "Illustration"],
  folders: [],
  annotation: "add from eagle api",
});
```

---

## addFromBase64(base64, options) <a href="#zmwst" id="zmwst"></a>

添加 base64 图像至 Eagle

- `base64`string - base64 格式图像
- `options` Object
  - `name` string (可选) - 文件名
  - `website` string (可选) - 来源网址
  - `tags` string\[] (可选) - 标签
  - `folders` string\[] (可选) - 所属文件夹 IDs
  - `annotation` string (可选) - 注释
- 返回 `Promise<itemId: string>` - `itemId`成功创建的项目 ID

```javascript
const base64 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMjM0IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyNDAgMjM0Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iIzI2MTMwMCIgZD0iTTEwIDEwaDIyMHYyMTMuOTk5aC0yMjB6Ii8+PHBhdGggZD0iTTAgMHYyMzRoMjQwLjAwMXYtMjM0aC0yNDAuMDAxem0xMCAxMGgyMjAuMDAxdjIxNGgtMjIwLjAwMXYtMjE0em03My4yNTIgMTIyLjUwMWwtNy45MiAyOS45ODJjLS4xNjUuODI0LS40OTUgMS4wMTgtMS40ODUgMS4wMThoLTE0LjY4N2MtLjk4OCAwLTEuMTUyLS4zMy0uOTg4LTEuNDg1bDI4LjM4LTk5LjQ0OGMuNDk1LTEuODE1LjgyNS0zLjM3Ny45OS04LjMyOCAwLS42Ni4zMy0uOTkuODI1LS45OWgyMC45NTVjLjY2IDAgLjk5LjE2NSAxLjE1NS45OWwzMS44NDUgMTA3Ljk0Yy4xNjUuODI0IDAgMS4zMi0uODI1IDEuMzJoLTE2LjVjLS44MjQgMC0xLjMxOS0uMTkzLTEuNDg0LS44NTRsLTguMjUtMzAuMTQ2aC0zMi4wMTF6bTI3Ljg4NS0xNi4yNWMtMi44MDUtMTEuMDU2LTkuNDA1LTM1LjI4Ni0xMS44OC00N2gtLjE2NWMtMi4xNDYgMTEuNzE1LTcuNDI1IDMxLjQ5LTExLjU1IDQ3aDIzLjU5NXptNDQuOTkzLTU1LjU3OGMwLTYuNDM1IDQuNDU1LTEwLjIzIDEwLjIzLTEwLjIzIDYuMTA1IDAgMTAuMjMgNC4xMjUgMTAuMjMgMTAuMjMgMCA2LjYtNC4yOSAxMC4yMy0xMC4zOTUgMTAuMjMtNS45NCAwLTEwLjA2NS0zLjYzLTEwLjA2NS0xMC4yM3ptMS4xMiAyMi43MzJjMC0uODI1LjMzLTEuMTU1IDEuMTU1LTEuMTU1aDE1LjY4OWMuODI1IDAgMS4xNTUuMzMgMS4xNTUgMS4xNTV2NzguOTM5YzAgLjgyNi0uMTY1IDEuMTU2LTEuMTU1IDEuMTU2aC0xNS41MjRjLS45OSAwLTEuMzItLjQ5Ni0xLjMyLTEuMzJ2LTc4Ljc3NXoiIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBmaWxsPSIjRkY3QzAwIi8+PC9zdmc+";
const itemId = await eagle.item.addFromBase64(base64, {
  name: "Illustation Logo",
  website: "https://www.eagle.cool/",
  tags: ["Adobe", "Logo"],
  folders: [],
  annotation: "ai logo form api",
});
```

---

## addFromPath(path, options) <a href="#lnsox" id="lnsox"></a>

从本地文件路径添加文件至 Eagle

- `path`string - 欲添加文件路径
- `options` Object
  - `name` string (可选) - 文件名
  - `website` string (可选) - 来源网址
  - `tags` string\[] (可选) - 标签
  - `folders` string\[] (可选) - 所属文件夹 IDs
  - `annotation` string (可选) - 注释
- 返回 `Promise<itemId: string>` - `itemId`成功创建的项目 ID

```javascript
const filePath = "C:\\Users\\User\\Downloads\\ai.svg";
const itemId = await eagle.item.addFromPath(filePath, {
  name: "Illustation Logo",
  website: "https://www.eagle.cool/",
  tags: ["Adobe", "Logo"],
  folders: [],
  annotation: "ai logo form api",
});
```

---

## addBookmark(url, options) <a href="#atulp" id="atulp"></a>

添加书签链接至 Eagle

- `url`string - 欲添加书签链接
- `options` Object
  - `name` string (可选) - 书签名
  - `base64` string (可选) - 自订缩图 base64 格式
  - `tags` string\[] (可选) - 标签
  - `folders` string\[] (可选) - 所属文件夹 IDs
  - `annotation` string (可选) - 注释
- 返回 `Promise<itemId: string>` - `itemId`成功创建的项目 ID

```javascript
const bookmarkURL = "https://www.google.com/";
const itemId = await eagle.item.addBookmark(bookmarkURL, {
  name: "Eagle",
  tags: ["Eagle", "Site"],
  folders: [],
  annotation: "bookmark form api",
});
```

```javascript
const bookmarkURL = "https://www.google.com/";
const base64 =
  "data:image/png;base64,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";
const itemId = await eagle.item.addBookmark(bookmarkURL, {
  name: "Eagle",
  base64: base64,
  tags: ["Eagle", "Site"],
  folders: [],
  annotation: "bookmark form api",
});
```

---

## open(itemId, options) <a href="#yxkul" id="yxkul"></a>

在全部列表显示 `itemId` 对应的文件

- `itemId`string - 欲显示文件 ID
- `options` Object (可选) - 开启选项
  - `window` boolean (可选) - 是否在新窗口中开启文件，默认为 `false`
- 返回 `Promise<result: boolean>`

```javascript
// 在当前窗口开启
await eagle.item.open("item_id");

// 在新窗口开启
await eagle.item.open("item_id", { window: true });
```

{% hint style="info" %}
提示：`window` 参数需要 Eagle 4.0 build12 以上版本支持。
{% endhint %}

{% hint style="info" %}
提示：你也可以直接呼叫 item 实例的 `open()` 方法打开文件。
{% endhint %}

---

## 類：Item <a href="#uezi0" id="uezi0"></a>

由 Eagle API `get`返回的 Object 类型，提供修改、保存功能。

{% hint style="success" %}
**🦄 最佳实践：** 为了确保数据安全性，请使用 Item 实例提供的 `save()` 方法进行数据的存取与修改，应避免直接修改 Eagle 资源库底下的 `metadata.json` 或任意文件。
{% endhint %}

---

#### 实例方法 <a href="#sihmc" id="sihmc"></a>

### **save()**

保存所有修改

- 返回 `Promise<result: boolean>` - `result`是否修改成功

```javascript
let item = await eagle.item.getById("item_id");
item.name = "New Name";
item.tags = ["tag_1", "tag_2"];

// 保存修改
await item.save();
```

---

### moveToTras&#x68;**()**

将文件丢到垃圾桶

- 返回 `Promise<result: boolean>` - `result`是否成功删除

```javascript
await item.moveToTrash();
```

---

### **replaceFile(filePath)**

使用指定文件替换原文件，将自动刷新缩略图，无须再次呼叫 `refreshThumbnail()`。

{% hint style="success" %}
**🦄 最佳实践：** 直接对要更改的文件进行操作是具有风险的，若过程中出现错误或异常，都有可能造成文件损毁且无法复原。因此，先将新版本文件保存在电脑其它路径，确定无误后，再使用 `replaceFile()`方法来替换是更稳健的作法。
{% endhint %}

- `filePath`string - 欲替换文件之路径
- 返回 `Promise<result: boolean>` - `result`是否替换成功

```javascript
let item = await eagle.item.getById("item_id");
let result = await item.replaceFile("new_file_path");

console.log(result);
```

---

### **refreshThumbnail()**

重新刷新文件缩略图，同时也会重新获取文件大小、颜色分析、尺寸等属性。

- 返回 `Promise<result: boolean>` - `result`是否成功

```javascript
let item = await eagle.item.getById("item_id");
let result = await item.refreshThumbnail();

console.log(result);
```

---

### **setCustomThumbnail(thumbnailPath)**

为文件设置自定缩略图。

- `thumbnailPath`string - 欲设置缩略图的路径
- 返回 `Promise<result: boolean>` - `result`是否替换成功

```javascript
let item = await eagle.item.getById("item_id");
let result = await item.setCustomThumbnail("thumbnail_path");

console.log(result);
```

---

### **open(options)**

在全部列表显示此文件

- `options` Object (可选) - 开启选项
  - `window` boolean (可选) - 是否在新窗口中开启文件，默认为 `false`
- 返回 `Promise<void>`

{% hint style="info" %}
提示：你也可以直接呼叫 `eagle.item.open(itemId, options)`方法打开文件夹。
{% endhint %}

```javascript
let item = await eagle.item.getById("item_id");
// 在当前窗口开启
await item.open();

// 在新窗口开启
await item.open({ window: true });

// 等价于
await eagle.item.open("item_id");
await eagle.item.open("item_id", { window: true });
```

{% hint style="info" %}
提示：`window` 参数需要 Eagle 4.0 build12 以上版本支持。
{% endhint %}

---

### **select()**

选中此文件

- 返回 `Promise<result: boolean>` - `result` 是否选中成功

```javascript
let item = await eagle.item.getById("item_id");
await item.select();

// 等价于
await eagle.item.select([item.id]);
```

{% hint style="info" %}
提示：调用实例方法 `select()` 会清空当前选中并仅选中此文件。如需批量选中多个文件，请使用静态方法 `eagle.item.select(itemIds)`。
{% endhint %}

{% hint style="info" %}
提示：`select()` 方法需要 Eagle 4.0 build12 以上版本支持。
{% endhint %}

---

#### 实例属性 <a href="#woenk" id="woenk"></a>

### **`id` string**

只读，文件 ID。

### **`name` string**

文件名。

### **`ext` string**

只读，文件扩展名。

### **`width` Interger**

图像宽度。

### **`height` Interger**

图像高度。

### **`url` string**

来源链接。

### **`isDeleted` boolean**

只读，文件是否在垃圾桶。

### **`annotation` string**

文件注释。

### **`tags` string\[]**

文件标签。

### **`folders` string\[]**

所属文件夹 ids。

### **`palettes` Object\[]**

只读，色票信息。

### **`size` Interger**

只读，文件大小。

### **`star` Interger**

评分信息，`0 ~ 5`。

### **`importedAt` Interger**

导入时间（时间戳）。可读写，修改后需调用 `save()` 保存。

```javascript
// 读取导入时间
let date = new Date(item.importedAt);

// 修改导入时间（需要 Eagle 4.0 build18+）
item.importedAt = Date.now();
item.importedAt = new Date("2024-01-01").getTime();
await item.save();
```

{% hint style="info" %}
备注：设置值必须为正整数时间戳，无效值将被忽略。此功能需要 Eagle 4.0 build18 或更高版本。
{% endhint %}

### **`modifiedAt` Interger**

只读，最后修改时间。

```javascript
let modifiedDate = new Date(item.modifiedAt);
console.log(`文件最后修改于: ${modifiedDate.toLocaleString()}`);
```

### **`noThumbnail` boolean**

只读，文件是否有缩略图，无缩略图文件将以原始文件进行预览。

### **`noPreview` boolean**

只读，文件是否支持双击预览。

### **`filePath` string**

只读，返回文件所在路径。

### **`fileURL` string**

只读，返回文件所在路径之链接（`file:///`）。

### **`thumbnailPath` string**

只读，返回缩略图路径。

### **`thumbnailURL` string**

只读，返回缩略图链接（`file:///`），如需在 HTML 显示该文件，可以使用这个属性。

### **`metadataFilePath`string**

只读，该文件 `metadata.json` 所在位置。

{% hint style="success" %}
**🦄 最佳实践：** 为了确保数据安全性，请使用 `item` API 提供的 `save()` 方法进行数据的存取与修改，应避免直接 `metadata.json`。
{% endhint %}

### &#x20;<a href="#nptwx" id="nptwx"></a>

# folder（文件夾）

```javascript
// 取得 Eagle 应用当前被选中的文件夹
let folder = (await eagle.folder.getSelected())[0];

// 修改属性
folder.name = "New Folder Name";
folder.description = "New description...";

// 保存修改
await folder.save();
```

{% hint style="success" %}
**🦄 最佳实践：** 为了确保数据安全性，请使用 API 提供的 `save()` 方法进行数据的存取与修改，应避免直接修改 Eagle 资源库底下的 `metadata.json` 或任意文件。
{% endhint %}

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## create(options) <a href="#xnzds" id="xnzds"></a>

建立文件夾

- `options` Object
  - `name` string - 文件夾名
  - `description` string (可选) - 文件夾描述
  - `parent` string (可选) - 父文件夹 ID，带此参数等同 `createSubfolder(parentId, options)`
- 返回 `Promise<folder: Folder>` - `folder` 成功创建的文件夹

```javascript
let newFoler = await eagle.folder.create({
  name: "New Folder",
  description: "Folder's description.",
});
```

---

## createSubfolder(parentId, options) <a href="#rys4i" id="rys4i"></a>

建立子文件夾

- `parentId` string - 父文件夹 ID
- `options` Object
  - `name` string - 文件夾名
  - `description` string (可选) - 文件夾描述
- 返回 `Promise<folder: Folder>` - `folder` 成功创建的文件夹

```javascript
let parentFolder = await eagle.folder.getById("folder_id");
let subFolder = await eagle.folder.createSubfolder(parentFolder.id, {
  name: "Subfolder",
  description: "Subfolder description.",
});
```

---

## get(options) <a href="#x9nu2" id="x9nu2"></a>

获取指定条件的文件夹。

- `options` Object - 查询条件
  - `id` string (可选) - 文件夾 id
  - `ids` string\[] (可选) - 文件夾 id 数组
  - `isSelected` boolean (可选) - 正在被选中的文件夹
  - `isRecent` boolean (可选) - 近期存取的文件夹
- 返回 `Promise<folders: Folder[]>` - `folders` 查询结果

```javascript
// 取得指定 id 对应的文件夹
let folders = await eagle.folder.get({
  ids: ["folder_id1", "folder_id2"],
});

// 取得应用当前被选中的文件夹
let folders = await eagle.folder.get({
  isSelected: true,
});
```

---

## getAll() <a href="#fbdzh" id="fbdzh"></a>

获取所有文件夹。

- 返回 `Promise<folders: Folder[]>` - `folders` 查询结果

```javascript
let folders = await eagle.folder.getAll();
```

---

## getById(folderId) <a href="#sy5fz" id="sy5fz"></a>

获取对应 `folderId` 的文件夹。

- `folderId` string - 文件夾 id
- 返回 `Promise<folder: Folder>` - `folder` 查询结果

```javascript
let folder = await eagle.folder.getById("folder_id");
```

---

## getByIds(folderIds) <a href="#n0gjq" id="n0gjq"></a>

获取对应 `folderIds` 的文件夹数组。

- `folderIds` string\[] - 文件夾 id 数组
- 返回 `Promise<folders: Folder[]>` - `folders` 查询结果

```javascript
let folders = await eagle.folder.getByIds(["folder_id1", "folder_id2"]);
```

---

## getSelected() <a href="#dsbgj" id="dsbgj"></a>

获取当前应用选中的文件夹

- 返回 `Promise<folders: Folder[]>` - `folders`

```javascript
let folders = await eagle.folder.getSelected();
```

---

## getRecents() <a href="#dwsxw" id="dwsxw"></a>

获取最近使用的的文件夹

- 返回 `Promise<folders: Folder[]>` - `folders`

```javascript
let folders = await eagle.folder.getRecents();
```

---

## open(folderId) <a href="#gjdst" id="gjdst"></a>

Eagle 将打开对应 `folderId`文件夹。

- 返回 `Promise<void>`

```javascript
await eagle.folder.open("folder_id");

// 等价于
let folder = await eagle.folder.getById("folder_id");
await folder.open();
```

{% hint style="info" %}
提示：你也可以直接呼叫 folder 实例的 `open()` 方法打开文件夹。
{% endhint %}

---

## 類：Folder <a href="#uezi0" id="uezi0"></a>

由 Folder API `get`返回的 Object 类型，提供修改、保存功能。

```javascript
let folder = await eagle.folder.getById("folder_id");

console.log(folder.id);
console.log(folder.name);

folder.name = "new name";
console.log(folder.name);

await folder.save();
```

{% hint style="success" %}
**🦄 最佳实践：** 为了确保数据安全性，请使用 Folder 实例提供的 `save()` 方法进行数据的存取与修改，应避免直接修改 Eagle 资源库底下的 `metadata.json` 或任意文件。
{% endhint %}

---

#### 实例方法 <a href="#sihmc" id="sihmc"></a>

### **save()**

保存所有修改

- 返回 `Promise<void>`

```javascript
let folder = await eagle.folder.getById("folder_id");
folder.name = "New Fodler Name";

// 保存修改
await folder.save();
```

---

### **open()**

Eagle 将打开此文件夹。

- 返回 `Promise<void>`

```javascript
let folder = await eagle.folder.getById("folder_id");
await folder.open();

// 等价于
await eagle.folder.open("folder_id");
```

{% hint style="info" %}
提示：你也可以直接呼叫 `eagle.folder.open(folderId)`方法打开文件夹。
{% endhint %}

---

#### 实例属性 <a href="#woenk" id="woenk"></a>

`Folder` 实例包含以下属性：

### **`id` string**

只读，文件夹 id。

### **`name` string**

文件夹名称。

### **`description` string**

文件夹描述、介绍。

### **`icon` string**

只读，文件夹图标。

### **`iconColor` string**

文件夹图标颜色。

```javascript
let folder = await eagle.folder.getById("folder_id");

// 设置文件夹颜色为红色
folder.iconColor = eagle.folder.IconColor.Red;

// 或直接使用字符串值
folder.iconColor = "red";

// 保存修改
await folder.save();
```

{% hint style="info" %}
提示：在 Eagle 4.0 build12 版本之前，此属性为只读状态，不支持修改。从 Eagle 4.0 build12 版本开始，支持修改此属性。
{% endhint %}

### **`createdAt` Interger**

只读，文件夹创建时间(timestamp)。

```javascript
let date = new Date(folder.createdAt);
```

### **`parent` string**

父文件夾 ID。

```javascript
let folder = await eagle.folder.getById("folder_id");

// 获取父文件夹 ID
console.log(folder.parent);

// 更改父文件夹（将文件夹移动到另一个父文件夹下）
folder.parent = "parent_folder_id";
await folder.save();

// 移动到根目录（设为 null 或 undefined）
folder.parent = null;
await folder.save();
```

{% hint style="info" %}
提示：在 Eagle 4.0 build12 版本之前，此属性为只读状态，不支持修改。从 Eagle 4.0 build12 版本开始，支持修改此属性，可以通过更改此属性来移动文件夹到不同的父文件夹下。
{% endhint %}

### **`children` Folder\[]**

只读，子文件夹数组。

```javascript
let children = folder.children;

console.log(children[0]);
await children[0].open();
```

---

## 靜態屬性 <a href="#static-properties" id="static-properties"></a>

### **`IconColor` Object**

提供预定义的文件夹图标颜色常量，用于设置文件夹的 `iconColor` 属性。

```javascript
// 可用的颜色常量
eagle.folder.IconColor.Red; // 'red'
eagle.folder.IconColor.Orange; // 'orange'
eagle.folder.IconColor.Yellow; // 'yellow'
eagle.folder.IconColor.Green; // 'green'
eagle.folder.IconColor.Aqua; // 'aqua'
eagle.folder.IconColor.Blue; // 'blue'
eagle.folder.IconColor.Purple; // 'purple'
eagle.folder.IconColor.Pink; // 'pink'
```

**使用示例：**

```javascript
let folder = await eagle.folder.getById("folder_id");

// 使用颜色常量设置文件夹颜色
folder.iconColor = eagle.folder.IconColor.Blue;
await folder.save();

// 批量设置多个文件夹颜色
let folders = await eagle.folder.getAll();
for (let i = 0; i < folders.length; i++) {
  if (i % 2 === 0) {
    folders[i].iconColor = eagle.folder.IconColor.Green;
  } else {
    folders[i].iconColor = eagle.folder.IconColor.Purple;
  }
  await folders[i].save();
}
```

{% hint style="success" %}
**🦄 最佳实践：** 建议使用 `eagle.folder.IconColor` 常量而非直接使用字符串值，这样可以获得更好的代码提示和类型安全。
{% endhint %}

### &#x20;<a href="#nptwx" id="nptwx"></a>

# tag（标签）

```javascript
// 取得所有标签
const tags = await eagle.tag.get();

// 按名称筛选标签
const designTags = await eagle.tag.get({ name: "design" });

// 取得最近使用标签
const recents = await eagle.tag.getRecentTags();

// 取得常用标签
const starred = await eagle.tag.getStarredTags();
```

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## get(options) <a href="#x9nu2" id="x9nu2"></a>

获取标签，可通过选项进行筛选。

- `options` Object (可选) - 查询条件
  - `name` string (可选) - 按标签名称进行模糊搜索，不区分大小写
- 返回 `Promise<tags: Object[]>` - tags 查询结果。

```javascript
// 获取所有标签
const tags = await eagle.tag.get();

// 按名称筛选标签
const filteredTags = await eagle.tag.get({
  name: "design",
});
```

{% hint style="info" %}
提示：`name` 参数需要 Eagle 4.0 build12 以上版本支持。
{% endhint %}

---

## getRecentTags() <a href="#dwsxw" id="dwsxw"></a>

获取最近使用的的标签。

- 返回 `Promise<tags: Object[]>` - tags 查询结果。

```javascript
const recents = await eagle.tag.getRecentTags();
```

---

## getStarredTags() <a href="#starred" id="starred"></a>

获取常用标签（用户收藏的标签）。

- 返回 `Promise<tags: Object[]>` - tags 查询结果。

```javascript
const starred = await eagle.tag.getStarredTags();
```

{% hint style="info" %}
提示：`getStarredTags()` 方法需要 Eagle 4.0 build18 以上版本支持。
{% endhint %}

---

## merge(options) <a href="#merge" id="merge"></a>

合并标签：将来源标签重新命名为目标标签，所有使用来源标签的素材都会自动更新。

- `options` Object - 选项参数
  - `source` string - 来源标签名称（将被移除）
  - `target` string - 目标标签名称（合并后保留）
- 返回 `Promise<Object>` - 合并结果
  - `affectedItems` number - 受影响的素材数量
  - `sourceRemoved` boolean - 来源标签是否已移除

```javascript
// 将所有 "UI Design" 标签合并为 "UI"
const result = await eagle.tag.merge({
  source: "UI Design",
  target: "UI",
});

console.log(`已合并 ${result.affectedItems} 个素材的标签`);
```

{% hint style="info" %}
提示：`merge()` 方法需要 Eagle 4.0 build18 以上版本支持。
{% endhint %}

{% hint style="warning" %}
注意：合并操作会更新所有使用来源标签的素材、标签群组、收藏标签和历史标签。此操作不可逆。
{% endhint %}

---

## 类：Tag <a href="#tag-class" id="tag-class"></a>

由 Eagle API `get` 返回的 Object 类型，提供修改、保存功能。

{% hint style="success" %}
**🦄 最佳实践：** 为了确保数据安全性，请使用 Tag 实例提供的 `save()` 方法进行数据的修改，应避免直接修改 Eagle 资源库底下的标签数据。
{% endhint %}

---

### 实例方法 <a href="#instance-methods" id="instance-methods"></a>

#### **save()**

保存标签的修改。目前仅支持修改标签名称。

- 返回 `Promise<result: boolean>` - `result` 是否修改成功

```javascript
// 获取所有标签
const tags = await eagle.tag.get();

// 找到要修改的标签
const tag = tags.find((t) => t.name === "old-name");

// 修改标签名称
tag.name = "new-name";

// 保存修改
await tag.save();
```

{% hint style="info" %}
提示：`save()` 方法需要 Eagle 4.0 build12 以上版本支持。
{% endhint %}

{% hint style="warning" %}
注意：修改标签名称后，所有使用该标签的文件都会自动更新为新的标签名称。
{% endhint %}

---

### 实例属性 <a href="#instance-properties" id="instance-properties"></a>

#### **`name` string**

标签名称。可修改此属性并通过 `save()` 方法保存。

#### **`count` number**

只读，使用此标签的文件数量。

#### **`color` string**

标签颜色。

#### **`groups` string\[]**

只读，标签所属的分组。

#### **`pinyin` string**

只读，标签名称的拼音（用于搜索和排序）。

# library（资源库）

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## info() <a href="#s7pkf" id="s7pkf"></a>

取得当前资源库详细信息，包含文件夹、智能文件夹、标签群组等

- 返回 `Promise<data: Object>`
  - `data` Object - 资源库各项属性

```javascript
console.log(await eagle.library.info());
```

---

## 屬性 <a href="#adtwq" id="adtwq"></a>

`library` 模块包含以下属性：

## `name` string <a href="#qxggi" id="qxggi"></a>

返回当前资源库名称

```javascript
console.log(eagle.library.name);
// test
```

## `path` string <a href="#qxggi" id="qxggi"></a>

返回当前资源库所在路径

```javascript
console.log(eagle.library.path);
// C:\Users\User\Pictures\Design.library
```

## `modificationTime` Integer

返回最后修改时间 (timestamp)

```javascript
console.log(eagle.library.modificationTime);
// 1681281134495
```

# window（窗口）

下面示例为 `window` 的常用功能：

```javascript
await eagle.window.show(); // 显示插件窗口
await eagle.window.hide(); // 隐藏插件窗口

await eagle.window.minimize(); // 缩小窗口
await eagle.window.restore(); // 还原缩小

await eagle.window.maximize(); // 最大化窗口
await eagle.window.unmaximize(); // 还原最大化

await eagle.window.setFullScreen(true); // 设为全屏幕
await eagle.window.setFullScreen(false); // 离开全屏幕
```

---

#### 方法 <a href="#z1a5y" id="z1a5y"></a>

## show() <a href="#kaydt" id="kaydt"></a>

显示并聚焦于窗口。

- 返回 `Promise<>`

```javascript
await eagle.window.show();
```

---

## showInactive() <a href="#reqm4" id="reqm4"></a>

显示但不聚焦于窗口。

- 返回 `Promise<>`

```javascript
await eagle.window.showInactive();
```

---

## hide() <a href="#mklts" id="mklts"></a>

隐藏插件窗口。

- 返回 `Promise<>`

```javascript
await eagle.window.hide();
```

---

## focus() <a href="#lskqe" id="lskqe"></a>

使插件窗口获取焦点。

- 返回 `Promise<>`

```javascript
await eagle.window.focus();
```

---

## minimize() <a href="#de7df" id="de7df"></a>

最小化插件窗口。

- 返回 `Promise<>`

```javascript
await eagle.window.minimize();
```

---

## isMinimized() <a href="#v47e2" id="v47e2"></a>

判断窗口是否最小化。

- 返回 `Promise<minimized: boolean>`
  - `minimized` boolean - 窗口是否最小化

```javascript
let isMinimized = await eagle.window.isMinimized();
```

---

## restore() <a href="#yvcxf" id="yvcxf"></a>

将插件窗口从最小化状态恢复到以前的状态。

- 返回 `Promise<>`

```javascript
await eagle.window.restore();
```

---

## maximize() <a href="#a53af" id="a53af"></a>

最大化插件窗口。 如果窗口尚未显示，该方法也会将其显示 (但不会聚焦)。

- 返回 `Promise<>`

```javascript
await eagle.window.maximize();
```

---

## unmaximize() <a href="#tg6me" id="tg6me"></a>

取消插件窗口最大化

- 返回 `Promise<>`

```javascript
await eagle.window.unmaximize();
```

---

## isMaximized() <a href="#zxdhs" id="zxdhs"></a>

判断窗口是否最大化

- 返回 `Promise<maximized: boolean>`
  - `maximized` boolean - 窗口是否最大化

```javascript
let isMaximized = await eagle.window.isMaximized();
```

---

## setFullScreen(flag) <a href="#leibk" id="leibk"></a>

设置窗口是否应处于全屏模式。

- `flag` boolean - 是否设为全屏
- 返回 `Promise<>`

```javascript
await eagle.window.setFullScreen(true); // 进入全屏
await eagle.window.setFullScreen(false); // 退出全屏
```

---

## isFullScreen() <a href="#irx5v" id="irx5v"></a>

判断窗口是否全屏

- 返回 `Promise<fullscreen: boolean>`
  - `fullscreen` boolean - 窗口是否全屏

```javascript
let isMaximized = await eagle.window.isMaximized();
```

---

## setAspectRatio(aspectRatio) <a href="#plpcl" id="plpcl"></a>

这将使窗口保持长宽比。

- `aspectRatio` Float - 保持的宽高比（宽 / 高）
- 返回 `Promise<>`

```javascript
await eagle.window.setAspectRatio(16 / 9); // 将窗口宽高比例限制为 16:9
```

---

## setBackgroundColor(backgroundColor) <a href="#no73b" id="no73b"></a>

设置窗口的背景颜色。

- `backgroundColor` String - 此参数表示您所希望的背景色的HEX代码。
- 返回 `Promise<>`

```javascript
await eagle.window.setBackgroundColor("#FFFFFF");
```

{% hint style="info" %}
注1：此属性可以直接在 manifest.json 进行设置。

注2：这个设定主要用来设定在 HTML / CSS 内容尚未完成前，窗口默认的背景颜色，适当的设定可以避免发生窗口显示出现闪烁的状况。
{% endhint %}

---

## setSize(width, height) <a href="#mq0dz" id="mq0dz"></a>

设置窗口大小

- `width` Integer - 窗口宽度
- `height` - Integer - 窗口高度
- 返回 `Promise<>`

```javascript
await eagle.window.setSize(720, 480);
```

{% hint style="info" %}
注：此属性可以直接在 manifest.json 进行设置。
{% endhint %}

## getSize() <a href="#mq0dz" id="mq0dz"></a>

取得窗口大小

- 返回 `Promise<Integer[]>`

```javascript
await eagle.window.getSize();
```

## setBounds(**bounds**)

调整窗口的大小并将其移动到提供的边界。任何未提供的属性将默认为当前值。

```javascript
await eagle.window.setBounds({ x: 440, y: 225, width: 800, height: 600 });
```

## getBounds()

取得窗口边界

- 返回 `Promise<Rectangle[]>` - 窗口边界的物件

```javascript
await eagle.window.getBounds();
```

## setResizable(resizable) <a href="#e56j2" id="e56j2"></a>

设置窗口是否支持调整大小

- `resizable` boolean - 是否支持调整大小
- 返回 `Promise<>`

```javascript
await eagle.window.setResizable(true);
await eagle.window.setResizable(false);
```

{% hint style="info" %}
注：此属性可以直接在 manifest.json 进行设置。
{% endhint %}

---

## isResizable() <a href="#pyh5l" id="pyh5l"></a>

窗口是否支持调整大小

- 返回 `Promise<resizable: boolean>`
  - `resizable` boolean

```javascript
let isResizable = await eagle.window.isResizable();
```

---

## setAlwaysOnTop(flag) <a href="#p5shn" id="p5shn"></a>

设置窗口是否应始终显示在其他窗口的前面。

- `flag` boolean
- 返回 `Promise<>`

```javascript
await eagle.window.setAlwaysOnTop(true);
await eagle.window.setAlwaysOnTop(false);
```

---

## isAlwaysOnTop() <a href="#quly3" id="quly3"></a>

窗口是否应始终显示在其他窗口的前面

- 返回 `Promise<alwaysOnTop: boolean>`
  - `alwaysOnTop` boolean

```javascript
let isAlwaysOnTop = await eagle.window.isAlwaysOnTop();
```

---

## setPosition(x, y) <a href="#erkhe" id="erkhe"></a>

将窗口移动到 x 和 y。

- `x` Integer
- `y` Integer
- 返回 `Promise<>`

```javascript
await eagle.window.setPosition(100, 200);
```

---

## getPosition() <a href="#ua19x" id="ua19x"></a>

取得插件窗口座标 x 和 y。

- 返回 `Promise<position: Integer[]>`
  - `position` Integer\[]
    - x - position\[0]
    - y - position\[1]

```javascript
let position = await eagle.window.getPosition(); // [100, 200]
```

---

## setOpacity(opacity) <a href="#dlzuz" id="dlzuz"></a>

设置窗口的不透明度， 超出界限的数值被限制在\[0, 1] 范围内。

- `opacity` number - 介于0.0 ( 完全透明 ) 和1.0 ( 完全不透明 ) 之间
- 返回 `Promise<>`

```javascript
await eagle.window.setOpacity(0.5);
```

---

## getOpacity() <a href="#fes0x" id="fes0x"></a>

取得窗口透明度，介于0.0 (完全透明) 和1.0 (完全不透明) 之间。

- 返回 `Promise<opacity: number>`
  - `opacity` number

```javascript
let opacity = await eagle.window.getOpacity();
```

---

## flashFrame(flag) <a href="#vxzv7" id="vxzv7"></a>

启动或停止闪烁窗口, 以吸引用户的注意。

- `flag` boolean - 是否闪烁
- 返回 `Promise<>`

```javascript
await eagle.window.flashFrame(true);
await eagle.window.flashFrame(false);
```

---

## setIgnoreMouseEvents(ignore) <a href="#yvfx8" id="yvfx8"></a>

忽略窗口内的所有鼠标事件。在此窗口中发生的所有鼠标事件将被传递到此窗口下面的窗口，但如果此窗口具有焦点，它仍然会接收键盘事件。

- `ignore` boolean - 是否忽略鼠标事件
- 返回 `Promise<>`

```javascript
await eagle.window.setIgnoreMouseEvents(true);
await eagle.window.setIgnoreMouseEvents(false);
```

{% hint style="info" %}
搭配 setAlwaysOnTop() 功能，将可以创建一个悬浮在屏幕最上方且可穿透鼠标点击的特殊窗口。
{% endhint %}

## capturePage(rect) <a href="#yvfx9" id="yvfx9"></a>

撷取 `rect` 指定区域的页面快照。省略 `rect` 将捕获整个可见页面。

- `rect` object - 可选，截图范围
  - `x` number
  - `y` number
  - `width` number
  - `height` number
- 返回 `Promise<[NativeImage](https://www.electronjs.org/docs/latest/api/native-image)>`

```javascript
const image = await eagle.window.capturePage();
const base64 = image.toDataURL("image/jpeg");

const image2 = await eagle.window.capturePage({
  x: 0,
  y: 0,
  width: 100,
  height: 50,
});
const buffer = image2.toPNG();
```

## setReferer(url) <a href="#id-4a6f" id="id-4a6f"></a>

函数用来配置当前的引用来源网址（referer URL）。当您配置了引用来源后，后续的请求都会使用这个配置的引用来源。

- `url` 文本 - 引用来源的网址
- 返回 `void`

```javascript
eagle.window.setReferer("https://cn.eagle.cool");
```

# app（应用）

下面示例为 `app` 的常用属性：

```javascript
console.log(eagle.app.version); // Eagle 版本
console.log(eagle.app.build); // Eagle Build 号
console.log(eagle.app.locale); // 应用界面语系，en/zh_CN/zh_TW/ja_JP
console.log(eagle.app.arch); // x86 | x64
console.log(eagle.app.platform); // darwin | win32
console.log(eagle.app.isWindows); // true | false, 操作系统是否为 Windows
console.log(eagle.app.isMac); // true | false, 操作系统是否为 Mac
console.log(eagle.app.runningUnderARM64Translation); // 是否运行在 rosetta 转译模式
```

---

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## isDarkColors() <a href="#a6hjz" id="a6hjz"></a>

确认当前系统是否处于深色（Dark）模式。

- 返回 `boolean` - 当前系统是否正在处于 Dark 模式。

```javascript
eagle.app.isDarkColors(); // true | false
```

---

## getPath(name) <a href="#b8lgu" id="b8lgu"></a>

您可以通过名称请求以下路径

- `name` string - 您可以通过名称请求以下路径
  - `home` - 用户的 home 文件夹（主目录）
  - `appData` - 每个用户的应用程序数据目录，默认情况下指向：
  - `userData` - 储存你应用程序配置文件的文件夹，默认是 appData 文件夹附加应用的名称 按照习惯用户存储的数据文件应该写在此目录，同时不建议在这写大文件，因为某些环境会备份此目录到云端存储。
  - `temp` - 临时文件夹
  - `exe` - 当前的可执行文件
  - `desktop` - 当前用户的桌面文件夹
  - `documents` - 用户文档目录的路径
  - `downloads` - 用户下载目录的路径
  - `music` - 用户音乐目录的路径
  - `pictures` - 用户图片目录的路径
  - `videos` - 用户视频目录的路径
  - `recent` - 用户最近文件的目录 (仅限 Windows)。
- 返回 `Promise<path: string>` - `path` 查询路径结果。

```javascript
await eagle.app.getPath("appData"); // 'C:\Users\User\AppData\Roaming'
await eagle.app.getPath("pictures"); // 'C:\Users\User\Pictures'
await eagle.app.getPath("desktop"); // 'C:\Users\User\Desktop'
```

{% hint style="info" %}
备注：此功能与 Electron API 的 [app.getPath](https://www.electronjs.org/zh/docs/latest/api/app#appgetapppath) 功能类似。
{% endhint %}

---

## getFileIcon(path\[, options]) <a href="#ndrop" id="ndrop"></a>

取得指定路径文件关联的图标。

- `path` string - 欲取得图示之文件路径
- `options` Object（可选）
  - `size` string
  - `small` - 16x16
  - `normal` - 32x32
  - `large` - `Windows` 为 32x32, `macOS` 不支持。
- 返回 `Promise<img: NativeImage>`
  - `img` [NativeImage](https://www.electronjs.org/zh/docs/latest/api/native-image) - 一个 NativeImage 类型的应用图标。

```javascript
let img = await eagle.app.getFileIcon("path_to_file", { size: "small" });

// 取得图像信息
let base64 = img.toDataURL();
let size = img.getSize(); // {'width': 16, height: 16}

// 保存到电脑
let buffer = img.toPNG();
require("fs").writeFileSync("output_path/example.png", buffer);
```

{% hint style="info" %}
备注：此功能与 Electron API 的 [app.getAppIcon](https://www.electronjs.org/zh/docs/latest/api/app#appgetfileiconpath-options) 功能类似。
{% endhint %}

---

## createThumbnailFromPath(path, maxSize) <a href="#psczp" id="psczp"></a>

取得指定路径文件关联的图标。

- `path` string - 欲取得缩略图之文件路径
- `maxSize` Size - 返回缩略图的最大宽度和高度(正数)。 在 Windows 平台下将忽略 maxSize.height 并根据 maxSize.width 缩放高度
- 返回 `Promise<img: NativeImage>`
  - `img` [NativeImage](https://www.electronjs.org/zh/docs/latest/api/native-image) - 文件的缩略图预览图像。

```javascript
let img = await eagle.app.createThumbnailFromPath("path_to_file", {
  height: 200,
  width: 200,
});

// 取得图像信息
let base64 = img.toDataURL();
let size = img.getSize(); // {'width': 200, height: 150}

// 保存到电脑
let buffer = img.toPNG();
require("fs").writeFileSync("output_path/example.png", buffer);
```

{% hint style="info" %}
备注：此功能与 Electron API 的 [nativeImage.createThumbnailFromPath(path, maxSize)](https://www.electronjs.org/zh/docs/latest/api/native-image#nativeimagecreatethumbnailfrompathpath-maxsize-macos-windows) 功能类似。
{% endhint %}

---

## show() <a href="#show" id="show"></a>

将 Eagle 主应用程序窗口唤起并显示在画面最上方。

- 返回 `Promise<boolean>` - 操作是否成功。

```javascript
await eagle.app.show();
```

{% hint style="info" %}
备注：此功能需要 Eagle 4.0 build18 或更高版本。
{% endhint %}

---

## 屬性 <a href="#adtwq" id="adtwq"></a>

## version <a href="#f95hw" id="f95hw"></a>

`string` 属性，获取当前 Eagle 应用程序版本。

## build <a href="#gwrv2" id="gwrv2"></a>

`number` 属性，获取当前 Eagle 应用程序 Build Number。

## locale <a href="#dd0fm" id="dd0fm"></a>

`string` 属性，获取当前 Eagle 应用程序界面语系。

- `en` - 英文
- `zh_CN` - 简体中文
- `zh_TW` - 繁体中文
- `ja_JP` - 日文
- `ko_KR` - 韩文
- `es_ES` - 西班牙文
- `de_DE` - 德文
- `ru_RU` - 俄文

## arch <a href="#hqmzh" id="hqmzh"></a>

`string` 属性，返回操作系統 CPU 架構。

- `x64`
- `arm64`
- `x86`

## platform <a href="#z5qbr" id="z5qbr"></a>

`string` 属性，返回一個標識操作系統平台的字符串。

- `darwin` - macOS 操作系统
- `win32` - Windows 操作系统

## env <a href="#bdd4y" id="bdd4y"></a>

`Object` 属性，返回环境变量的对象。

```javascript
console.log(eagle.app.env);

{
  APPDATA: "C:\\Users\\User\\AppData\\Roaming",
  HOMEDRIVE: "C:",
  HOMEPATH: "\\Users\\User",
  LANG: "zh_TW.UTF-8",
  TEMP: "C:\\Users\\User\\AppData\\Local\\Temp"
}
```

```javascript
console.log(eagle.app.env["TEMP"]);

("C:\\Users\\User\\AppData\\Local\\Temp");
```

## execPath <a href="#uvg0k" id="uvg0k"></a>

`string` 属性，当前应用程序执行路径。

```javascript
console.log(eagle.app.execPath);

("C:\\Program Files\\Eagle\\Eagle.exe");
```

## pid <a href="#cldbp" id="cldbp"></a>

`number` 属性，当前插件进程 id。

## isWindows <a href="#u8kad" id="u8kad"></a>

`boolean` 属性，是否当前为 Window 操作系统。

## isMac <a href="#qw2s4" id="qw2s4"></a>

`boolean` 属性，是否当前为 Mac 操作系统。

## runningUnderARM64Translation <a href="#kbkmv" id="kbkmv"></a>

`boolean` 属性，为 true 时表明当前应用正在使用 ARM64 运行环境 (比如 macOS [Rosetta Translator Environment](<https://en.wikipedia.org/wiki/Rosetta_(software)>) 或者 Windows [WOW](https://en.wikipedia.org/wiki/Windows_on_Windows)).

{% hint style="info" %}
提示：此功能与 Electron API 的 [app.runningUnderARM64Translation](https://www.electronjs.org/zh/docs/latest/api/app#apprunningunderarm64translation-%E5%8F%AA%E8%AF%BB-macos-windows) 功能类似，您可以使用此属性来提示用户下载应用程序的 arm64 版本，当用户错误地在转译环境下运行 x64 版本。
{% endhint %}

## theme <a href="#cztqx" id="cztqx"></a>

`string` 属性， - 当前主题配色的名称，如 `LIGHT`、`LIGHTGRAY`、`GRAY`、`DARK`、`BLUE`、`PURPLE`。

## userDataPath <a href="#ud9km" id="ud9km"></a>

`string` 属性，当前用户数据目录的路径。

```javascript
console.log(eagle.app.userDataPath);

("C:\\Users\\User\\AppData\\Roaming\\Eagle");
```

{% hint style="info" %}
备注：此功能需要 Eagle 4.0 build12 或更高版本。
{% endhint %}

### &#x20;<a href="#nptwx" id="nptwx"></a>

# os（操作系统）

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## tmpdir() <a href="#a6hjz" id="a6hjz"></a>

取得操作系统默认的暂存文件路径。

- 返回 `string` - 操作系统默认的暂存文件路径

```javascript
eagle.os.tmpdir(); // 'C:\\Users\\User\\AppData\\Local\\Temp'
```

---

## version() <a href="#gxw5i" id="gxw5i"></a>

取得操作系统內核版本的字符串。

- 返回 `string` - 操作系统內核版本的字符串

```javascript
eagle.os.version(); // 'Windows 10 Home'
```

---

## type() <a href="#jauoc" id="jauoc"></a>

返回的操作系統名稱。\
例如：在 macOS 上返回 `Darwin`，在 Windows 上返回 `Windows_NT`。

- 返回 `string` - 操作系統名稱

```javascript
eagle.os.type(); // 'Windows_NT', 'Darwin'
```

---

## release() <a href="#jmfqv" id="jmfqv"></a>

返回操作系统的发行版。

- 返回 `string` - 操作系统的发行版

```javascript
eagle.os.release(); // '10.0.22621'
```

---

## hostname() <a href="#w5b2t" id="w5b2t"></a>

返回操作系统的主机名。

- 返回 `string` - 操作系统的主机名

```javascript
eagle.os.hostname(); // 'My_Windows'
```

---

## homedir() <a href="#iiwv7" id="iiwv7"></a>

返回当前用户的 home 目录。

- 返回 `string` - 当前用户的 home 目录

```javascript
eagle.os.homedir(); // 'C:\\Users\\User'
```

---

## arch() <a href="#eekcv" id="eekcv"></a>

返回操作系統 CPU 架構。

- 返回 `string` - 当前 CPU 架構
  - `x64`
  - `arm64`
  - `x86`

```javascript
eagle.os.arch(); // 'x64'
```

### &#x20;<a href="#nptwx" id="nptwx"></a>

# screen（屏幕）

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## getCursorScreenPoint() <a href="#tkp0d" id="tkp0d"></a>

当前鼠标的绝对位置 x, y。

- 返回 `Promise<point: Object>`
  - `point` Object
    - `point.x`
    - `point.y`

```javascript
let point = await eagle.screen.getCursorScreenPoint();
```

---

## getPrimaryDisplay() <a href="#sskcn" id="sskcn"></a>

返回主屏幕信息

- 返回 `Promise<display: Display>`
  - `display` [Display](https://www.electronjs.org/zh/docs/latest/api/structures/display) 对象 - 当前屏幕信息

```javascript
let display = await eagle.screen.getPrimaryDisplay();
```

---

## getAllDisplays() <a href="#eev58" id="eev58"></a>

返回一个数组Display\[]，表示当前可用的屏幕。

- 返回 `Promise<displays: Display[]>`
  - `displays` [Display](https://www.electronjs.org/zh/docs/latest/api/structures/display)\[]

```javascript
let displays = await eagle.screen.getAllDisplays();
```

---

## getDisplayNearestPoint(point) <a href="#ox9dk" id="ox9dk"></a>

取得插件窗口座标 x 和 y。

- `point` Object
  - `point.x` Interger 类型
  - `point.y` Interger 类型
- 返回 `Promise<display: Display>`
  - `display` [Display](https://www.electronjs.org/zh/docs/latest/api/structures/display) 对象 - 当前屏幕信息

```javascript
let display = await eagle.screen.getDisplayNearestPoint({ x: 100, y: 100 });
```

# screen（屏幕）

## 方法 <a href="#z1a5y" id="z1a5y"></a>

## getCursorScreenPoint() <a href="#tkp0d" id="tkp0d"></a>

当前鼠标的绝对位置 x, y。

- 返回 `Promise<point: Object>`
  - `point` Object
    - `point.x`
    - `point.y`

```javascript
let point = await eagle.screen.getCursorScreenPoint();
```

---

## getPrimaryDisplay() <a href="#sskcn" id="sskcn"></a>

返回主屏幕信息

- 返回 `Promise<display: Display>`
  - `display` [Display](https://www.electronjs.org/zh/docs/latest/api/structures/display) 对象 - 当前屏幕信息

```javascript
let display = await eagle.screen.getPrimaryDisplay();
```

---

## getAllDisplays() <a href="#eev58" id="eev58"></a>

返回一个数组Display\[]，表示当前可用的屏幕。

- 返回 `Promise<displays: Display[]>`
  - `displays` [Display](https://www.electronjs.org/zh/docs/latest/api/structures/display)\[]

```javascript
let displays = await eagle.screen.getAllDisplays();
```

---

## getDisplayNearestPoint(point) <a href="#ox9dk" id="ox9dk"></a>

取得插件窗口座标 x 和 y。

- `point` Object
  - `point.x` Interger 类型
  - `point.y` Interger 类型
- 返回 `Promise<display: Display>`
  - `display` [Display](https://www.electronjs.org/zh/docs/latest/api/structures/display) 对象 - 当前屏幕信息

```javascript
let display = await eagle.screen.getDisplayNearestPoint({ x: 100, y: 100 });
```

# log（日志）

{% hint style="info" %}
点击这里查看 Eagle [软件日志](https://docs-cn.eagle.cool/article/92-how-do-i-get-the-error-log)获取方式。
{% endhint %}

```javascript
eagle.log.debug("debug message from plugin");
eagle.log.info("info message from plugin");
eagle.log.warn("warn message from plugin");
eagle.log.error("error message from plugin");

// [13:19:39.845] [debug] [plugin] "debug message from plugin"
// [13:19:39.845] [info] [plugin] "info message from plugin"
// [13:19:39.845] [warn] [plugin] "warn message from plugin"
// [13:19:39.845] [error] [plugin] "error message from plugin"
```

---

#### 方法 <a href="#z1a5y" id="z1a5y"></a>

## debug(obj) <a href="#haugb" id="haugb"></a>

记录 debug 类型内容到软件日志

- `obj` Object - 欲记录之内容，可以是 `Object`、`String`、`Array` 等各种格式

```javascript
eagle.log.debug(obj);
eagle.log.debug(array);
eagle.log.debug("error message from plugin");
```

---

## info(obj) <a href="#qxf3f" id="qxf3f"></a>

记录 info 类型内容到软件日志

- `obj` Object - 欲记录之内容，可以是 `Object`、`String`、`Array` 等各种格式

---

## warn(obj) <a href="#ctpju" id="ctpju"></a>

记录 warn 类型内容到软件日志

- `obj` Object - 欲记录之内容，可以是 `Object`、`String`、`Array` 等各种格式

---

## error(obj) <a href="#mo6j1" id="mo6j1"></a>

记录 error 类型内容到软件日志

- `obj` Object - 欲记录之内容，可以是 `Object`、`String`、`Array` 等各种格式

```javascript
try {
  let a = {};
  a.b.c = "test";
} catch (err) {
  eagle.log.error("error message from plugin");
  eagle.log.error(err.stack || err);
}

// [13:23:24.191] [error] [plugin] "error message from plugin"
// [13:23:24.191] [error] [plugin] "TypeError: Cannot set properties of undefined (setting 'c')\n    at <anonymous>:3:11"
```

---

# 格式扩展

格式扩展插件的主要目的是使 Eagle 能够预览尚未支持的文件格式。与其他类型插件不同，格式扩展插件在 `manifest.json` 中不需要定义 `main` 属性，而是需要设置 `preview` 属性。以下是一个范例代码：

```json
"preview": {}
```

在 `preview` 中可以定义要扩展的文件扩展名。例如，如果想要让 Eagle 支持 icns 图标格式，可以输入 `"icns": {}`：

```json
"preview" : {
    "icns": {}
}
```

另外，如果你需要同时设定多个扩展名，你可以使用 `,` 将不同扩展名隔开进行定义，比如：

```json
"preview" : {
    "icns,ico": {}
}
```

格式扩展插件可以分成两个部分：

1. `"thumbnail.path"`：提供用于解析要扩展的文件格式的缩略图的 `.js` 文件。
2. `"viewer.path"`：提供用于预览要扩展的格式的 `.html` 文件。

```json
"preview": {
    "icns": {
        "thumbnail": {
            "path": "thumbnail/icns.js",
            "size": 400,
            "allowZoom": false
        },
        "viewer": {
            "path": "viewer/icns.html"
        }
    }
}
```

设置其它 `metadata.json` 字段后，最终代码如下：

{% tabs %}
{% tab title="manifest.json" %}

```json
{
  "id": "LARSKLB8OTOC2",
  "version": "1.0.0",
  "platform": "all",
  "arch": "all",
  "name": "Preview Plugin",
  "logo": "/logo.png",
  "keywords": ["icns"],
  "devTools": false,
  "preview": {
    "icns,ico": {
      "thumbnail": {
        "path": "thumbnail/icns.js",
        "size": 400,
        "allowZoom": false
      },
      "viewer": {
        "path": "viewer/icns.html"
      }
    }
  }
}
```

{% endtab %}

{% tab title="thumbnail/icns.js" %}

```javascript
const fs = require("fs");
const icns = require("./../js/icns-util.js");
const imageSize = require("./../js/image-size.js");

module.exports = async ({ src, dest, item }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. parsing and generate thumbnail file to dest
      await icns.icns2png(src, dest);
      let size = await imageSize(dest);

      // 2. Check if the result is correct
      if (!fs.existsSync(dest) || size.width === 0) {
        return reject(new Error(`icns file thumbnail generate fail.`));
      }

      // 3. update the item dimensions
      item.height = size?.height || item.height;
      item.width = size?.width || item.width;

      // 4. return the result
      return resolve(item);
    } catch (err) {
      return reject(err);
    }
  });
};
```

{% endtab %}

{% tab title="viewer/icns.html" %}

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>ICNS Viewer</title>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      #viewer {
        pointer-events: none;
        object-fit: contain;
        object-position: center;
        width: 100%;
        height: 100%;
        max-width: 100vw;
        max-height: 100vh;
      }
    </style>
  </head>
  <body>
    <img id="viewer" />
    <script>
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      const filePath = urlParams.get("path");
      const width = urlParams.get("width");
      const height = urlParams.get("height");
      const theme = urlParams.get("theme");
      const lang = urlParams.get("lang");

      const viewer = document.querySelector("#viewer");

      // 1. Load the thumbnail image first
      // 👍 Avoid loading for too long, and UI has no content
      viewer.src = filePath.replace(".icns", "_thumbnail.png");

      // 2. Load the file and replace thumbnail
      (async function () {
        const icns = require("./../js/icns-util.js");
        let buffer = await icns.icns2buffer(filePath);
        let base64 = `data:image/png;base64,${buffer.toString("base64")}`;
        viewer.src = base64;
      })();
    </script>
  </body>
</html>
```

{% endtab %}
{% endtabs %}

{% hint style="warning" %}
请注意，目前格式扩展插件不支持 Eagle Plugin API 和 DevTools 调试功能。
{% endhint %}

{% hint style="info" %}
**完整示例代码：**\
<https://github.com/eagle-app/eagle-plugin-examples/tree/main/Preview>
{% endhint %}
完整示例代码：
https://github.com/eagle-app/eagle-plugin-examples/tree/main/Preview

# 检查器

{% hint style="info" %}
注意：检查器插件需要 Eagle 4.0 Beta 17 以上的版本才能支持。
{% endhint %}

你可以针对特定格式的文件，开发专属于该格式的额外检查器工具，当用户选择该文件时，就可以在右侧检查器直接使用该插件。例如：可以针对 JPG/Raw 文件开发 EXIF 属性的检查器插件，每当用户选择该文件时，就可以轻松在右侧查看到「拍摄时间、焦距、光圈、经纬度」等额外数据。

检查器插件其实是格式扩展插件的变体，其定义方式非常类似，检查器插件在 `manifest.json` 中不需要定义 `main` 属性，而是需要设置 `preview` 属性。以下是一个范例代码：

```json
{
  "preview": {}
}
```

在 `preview` 中可以定义要扩展的文件扩展名。例如，如果想开发一个针对 jpg, png 格式的额外插件，可以输入 `"`jpg,png`": {}`：

```json
{
  "preview": {
    "jpg,png": {}
  }
}
```

接着设定以下属性：

- `path`: 该插件的 HTML 文件路径
- `height`: 该插件的默认高度
- `multiSelect`: 多选时是否要显示（非特殊情况建议设置为 `false`）

```json
{
  "preview": {
    "jpg,png": {
      "inspector": {
        "path": "index.html",
        "height": 100,
        "multiSelect": false
      }
    }
  }
}
```

设置其它 `metadata.json` 字段后，最终代码如下：

{% tabs %}
{% tab title="manifest.json" %}

```json
{
  "id": "cc41e899-5fc3-445c-a113-2d9573d6edcc",
  "version": "1.0.0",
  "platform": "all",
  "arch": "all",
  "name": "Inspector Plugin",
  "logo": "/logo.png",
  "keywords": [],
  "devTools": true,
  "preview": {
    "jpg,png": {
      "inspector": {
        "path": "index.html",
        "height": 100,
        "multiSelect": false
      }
    }
  }
}
```

{% endtab %}

{% tab title="index.html" %}

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Inspector Plugin Example</title>
    <style>
      html {
        font-size: 11px;
        font-family: sans-serif;
        border-radius: 6px;
        overflow: hidden;
      }

      body {
        padding: 0;
        margin: 0;
        color: transparent;
      }

      /* colors for different themes */

      body[theme="LIGHT"],
      body[theme="LIGHTGRAY"] {
        color: black;
      }

      body[theme="GRAY"],
      body[theme="BLUE"],
      body[theme="PURPLE"],
      body[theme="DARK"] {
        color: white;
      }
    </style>
  </head>

  <body>
    Inspector Plugin Example
    <script>
      // Listen to plugin creation
      eagle.onPluginCreate(async (plugin) => {
        // Get the current theme
        const theme = await eagle.app.theme;
        document.body.setAttribute("theme", theme);

        // Get the selected item
        const item = await eagle.item.getSelected();

        console.log(item);
        console.log(theme);
      });

      // Listen to theme changes
      eagle.onThemeChanged((theme) => {
        document.body.setAttribute("theme", theme);
      });
    </script>
  </body>
</html>
```

{% endtab %}
{% endtabs %}

{% hint style="info" %}
**完整示例代码：**\
<https://github.com/eagle-app/eagle-plugin-examples/tree/main/Inspector>
{% endhint %}

### 如何调试检插件

调试检查器插件的方式很简单，你可以点击画面中的检查器插件右键，接着选择「开发者工具」，就可以进行调试了。

# 调试插件

## 窗口插件调试 <a href="#zqpdi" id="zqpdi"></a>

打开插件后，点击 `F12`键即可打开 `DevTools` 调试工具。

<figure><img src="https://3660253004-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FHZrMIIw27Dg9HnexbzyY%2Fuploads%2Fgit-blob-d8ac432fb05d0a6afa3de5926aa74d57579a69c4%2Fimage%20(5).png?alt=media" alt=""><figcaption></figcaption></figure>

具体步骤如下：

1. 在 Eagle 中打开您要调试的插件，按下 `F12` 键，这将打开 DevTools。
2. 在 DevTools 中，您可以查看插件的代码，并使用断点、调试工具来调试插件的执行过程。
3. 您还可以使用 DevTools 中的其他工具来查看插件的性能、内存使用情况等信息。

## 缩略图插件调试

缩略图插件运行在背景，代码仅会在文件添加、更新时被执行，如果你想要对缩略图功能代码进行调试，你可以在 `manifest.json` 文件中，将 `devTools` 属性设置为 `true` ，并在代码设置 `debugger` 断点，即可在 `devTools` 工具进行调试工作。

## 预览插件调试

添加并选中你想要开发的文件格式文件到 Eagle 中，打开插件面板，点击你正在开发预览插件，即可打开一个独立的预览窗口，你可以点击 `F12` 打开 `DevTools` 进行调试。

{% hint style="info" %}
了解更多：如果您不确定如何使用 DevTools，您可以查看下面这些学习资料来学习

1. Google 官方文档：<https://developers.google.com/web/tools/chrome-devtools>
2. MDN Web 文档：<https://developer.mozilla.org/zh-CN/docs/Tools>
3. W3Schools 教程：<https://www.w3schools.com/js/js_debugging.asp>
   {% endhint %}

## 日志系统 <a href="#pui04" id="pui04"></a>

{% hint style="warning" %}
注意：预览、缩略图插件目前不支持日志 API。
{% endhint %}

日志系统是一种用于记录软件运行状态的工具，它可以帮助开发人员更快地定位和解决问题。日志系统会记录软件的错误信息、警告信息、运行时间等信息，可以作为一种调试工具。在非开发环境下，日志系统可以有效地帮助开发人员找出问题的原因，并采取措施解决问题。

Eagle Plugin API 提供了一种用于记录插件运行信息的 [log](https://developer.eagle.cool/plugin-api/zh-cn/api/log) 功能，这样，开发人员就可以将插件的运行、警告、错误等信息记录在 Eagle 的软件日志中。使用这种功能，只需向用户提供调试报告，就能查看到这些信息。在开发插件时，使用日志功能可以帮助开发人员快速定位和解决问题。

```javascript
eagle.log.debug("debug message from plugin");
eagle.log.info("info message from plugin");
eagle.log.warn("warn message from plugin");
eagle.log.error("error message from plugin");

// [13:19:39.845] [debug] [plugin] "debug message from plugin"
// [13:19:39.845] [info] [plugin] "info message from plugin"
// [13:19:39.845] [warn] [plugin] "warn message from plugin"
// [13:19:39.845] [error] [plugin] "error message from plugin"
```

{% hint style="info" %}
了解更多： [Log - API 参考](https://developer.eagle.cool/plugin-api/zh-cn/api/log)
{% endhint %}

{% hint style="info" %}
点击这里查看 Eagle [软件日志](https://docs-cn.eagle.cool/article/92-how-do-i-get-the-error-log)获取方式。
{% endhint %}
