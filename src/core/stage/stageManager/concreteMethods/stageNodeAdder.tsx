import { Vector } from "../../../dataStruct/Vector";
import { Node } from "../../../Node";
import { StageManager } from "../StageManager";
import { v4 as uuidv4 } from "uuid";

/**
 * 包含增加节点的方法
 * 有可能是用鼠标增加，涉及自动命名器
 * 也有可能是用键盘增加，涉及快捷键和自动寻找空地
 */
export namespace StageNodeAdder {
  /**
   * 通过点击位置增加节点
   * @param clickWorldLocation
   * @returns
   */
  export function addNodeByClick(clickWorldLocation: Vector): string {
    const newUUID = uuidv4();
    const node = new Node({
      uuid: newUUID,
      text: "...",
      details: "",
      children: [],
      location: [clickWorldLocation.x, clickWorldLocation.y],
      size: [100, 100],
    });
    // 将node本身向左上角移动，使其居中
    node.rectangle.location = node.rectangle.location.subtract(
      node.rectangle.size.divide(2),
    );
    StageManager.addNode(node);
    return newUUID;
  }

  /**
   * 通过带有缩进格式的文本来增加节点
   */
  export function addNodeByText(text: string) {
    // 将本文转换成字符串数组，按换行符分割
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 跳过空行
      if (line.trim() === "") {
        continue;
      }
      // 解析缩进格式
      const indent = getIndentLevel(line);
      // 解析文本内容
      const textContent = line.trim();
      
      const newUUID = uuidv4();
      const node = new Node({
        uuid: newUUID,
        text: textContent,
        details: "",
        children: [],
        location: [indent * 50, i * 100],
        size: [100, 100],
      });

      StageManager.addNode(node);
    }
  }

  /***
   * 'a' -> 0
   * '    a' -> 1
   * '\t\ta' -> 2
   */
  function getIndentLevel(line: string): number {
    let indent = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === " ") {
        indent++;
      } else if (line[i] === "\t") {
        indent += 4;
      } else {
        break;
      }
    }
    return Math.floor(indent / 4);
  }
}
