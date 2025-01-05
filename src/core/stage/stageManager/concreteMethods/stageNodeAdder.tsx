import { Vector } from "../../../dataStruct/Vector";
import { TextNode } from "../../../stageObject/entity/TextNode";
import { Settings } from "../../../Settings";
import { StageManager } from "../StageManager";
import { v4 as uuidv4 } from "uuid";
import { ConnectPoint } from "../../../stageObject/entity/ConnectPoint";
import { Section } from "../../../stageObject/entity/Section";
import { Stage } from "../../Stage";
import { RectanglePushInEffect } from "../../../effect/concrete/RectanglePushInEffect";
import { ProgressNumber } from "../../../dataStruct/ProgressNumber";
import { MonoStack } from "../../../dataStruct/MonoStack";

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
  export async function addTextNodeByClick(
    clickWorldLocation: Vector,
    addToSections: Section[],
    selectCurrent = false,
  ): Promise<string> {
    const newUUID = uuidv4();
    const node = new TextNode({
      uuid: newUUID,
      text: await getAutoName(),
      details: "",
      location: [clickWorldLocation.x, clickWorldLocation.y],
      size: [100, 100],
    });
    // 将node本身向左上角移动，使其居中
    node.moveTo(
      node.rectangle.location.subtract(node.rectangle.size.divide(2)),
    );
    StageManager.addTextNode(node);

    for (const section of addToSections) {
      section.children.push(node);
      section.adjustLocationAndSize();
      Stage.effects.push(
        new RectanglePushInEffect(
          node.rectangle.clone(),
          section.rectangle.clone(),
          new ProgressNumber(0, 100),
        ),
      );
    }
    // 处理选中问题
    if (selectCurrent) {
      for (const otherNode of StageManager.getTextNodes()) {
        if (otherNode.isSelected) {
          otherNode.isSelected = false;
        }
      }
      node.isSelected = true;
    }
    return newUUID;
  }

  /**
   * 在当前已经选中的某个节点的情况下，增加节点
   * 增加在某个选中的节点的上方，下方，左方，右方等位置
   * @param selectCurrent
   * @returns
   */
  export async function addTextNodeFromCurrentSelectedNode(
    distanceLocation: Vector,
    addToSections: Section[],
    selectCurrent = false,
  ): Promise<string> {
    // 先检查当前是否有选中的唯一实体
    const selectedEntities = StageManager.getSelectedEntities();
    if (selectedEntities.length !== 1) {
      // 未选中或选中多个
      return "";
    }
    const selectedEntity = selectedEntities[0];
    const entityRectangle = selectedEntity.collisionBox.getRectangle();
    return await addTextNodeByClick(
      entityRectangle.center.add(distanceLocation),
      addToSections,
      selectCurrent,
    );
  }

  async function getAutoName(): Promise<string> {
    let template = await Settings.get("autoNamerTemplate");
    if (template.includes("{{i}}")) {
      let i = 0;
      while (true) {
        const name = template.replace("{{i}}", i.toString());
        let isConflict = false;
        for (const node of StageManager.getTextNodes()) {
          if (node.text === name) {
            i++;
            isConflict = true;
            continue;
          }
        }
        if (!isConflict) {
          break;
        }
      }
      template = template.replaceAll("{{i}}", i.toString());
    }
    if (template.includes("{{date}}")) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      template = template.replaceAll("{{date}}", `${year}-${month}-${date}`);
    }
    if (template.includes("{{time}}")) {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();
      template = template.replaceAll("{{time}}", `${hour}:${minute}:${second}`);
    }
    return template;
  }

  export function addConnectPoint(
    clickWorldLocation: Vector,
    addToSections: Section[],
  ): string {
    const newUUID = uuidv4();
    const connectPoint = new ConnectPoint({
      uuid: newUUID,
      location: [clickWorldLocation.x, clickWorldLocation.y],
    });
    StageManager.addConnectPoint(connectPoint);
    for (const section of addToSections) {
      section.children.push(connectPoint);
      section.adjustLocationAndSize();
      Stage.effects.push(
        new RectanglePushInEffect(
          connectPoint.collisionBox.getRectangle(),
          section.rectangle.clone(),
          new ProgressNumber(0, 100),
        ),
      );
    }
    return newUUID;
  }

  /**
   * 通过带有缩进格式的文本来增加节点
   */
  export function addNodeByText(
    text: string,
    indention: number,
    diffLocation: Vector = Vector.getZero(),
  ) {
    // 将本文转换成字符串数组，按换行符分割
    const lines = text.split("\n");

    const rootUUID = uuidv4();

    // 准备好栈和根节点
    const rootNode = new TextNode({
      uuid: rootUUID,
      text: "root",
      details: "",
      location: [diffLocation.x, diffLocation.y],
      size: [100, 100],
    });
    const nodeStack = new MonoStack<TextNode>();
    nodeStack.push(rootNode, -1);
    StageManager.addTextNode(rootNode);
    // 遍历每一行
    for (let yIndex = 0; yIndex < lines.length; yIndex++) {
      const line = lines[yIndex];
      // 跳过空行
      if (line.trim() === "") {
        continue;
      }
      // 解析缩进格式
      const indent = getIndentLevel(line, indention);
      // 解析文本内容
      const textContent = line.trim();

      const newUUID = uuidv4();
      const node = new TextNode({
        uuid: newUUID,
        text: textContent,
        details: "",
        location: [indent * 50 + diffLocation.x, yIndex * 100 + diffLocation.y],
        size: [100, 100],
      });
      StageManager.addTextNode(node);

      // 检查栈
      // 保持一个严格单调栈
      if (nodeStack.peek()) {
        nodeStack.push(node, indent);
        const fatherNode = nodeStack.unsafeGet(nodeStack.length - 2);
        StageManager.connectEntity(fatherNode, node);
      }
    }
  }

  /***
   * 'a' -> 0
   * '    a' -> 1
   * '\t\ta' -> 2
   */
  function getIndentLevel(line: string, indention: number): number {
    let indent = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === " ") {
        indent++;
      } else if (line[i] === "\t") {
        indent += indention;
      } else {
        break;
      }
    }
    return Math.floor(indent / indention);
  }
}
