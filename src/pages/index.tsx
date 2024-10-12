import { useEffect, useRef } from "react";
import { Renderer } from "../core/render/canvas2d/renderer";
import { useDialog } from "../utils/dialog";
import { Stage } from "../core/stage/Stage";
import { Controller } from "../core/controller/Controller";
import { Canvas } from "../core/stage/Canvas";
import { StageManager } from "../core/stage/stageManager/StageManager";
import React from "react";
import Toolbar from "./_toolbar";
import { Settings } from "../core/Settings";
import { cn } from "../utils/cn";
import { Camera } from "../core/stage/Camera";

export default function Home() {
  const canvasRef: React.RefObject<HTMLCanvasElement> = useRef(null);
  const [fps, setFps] = React.useState(0);

  const dialog = useDialog();
  const [cursorName, setCursorName] = React.useState("default");

  const [isSearchingShow, setIsSearchingShow] = React.useState(false);

  const [currentSearchResultIndex, setCurrentSearchResultIndex] =
    React.useState(0);

  useEffect(() => {
    if (Stage.searchResultNodes.length == 0) {
      setCurrentSearchResultIndex(-1);
    } else {
      setCurrentSearchResultIndex(Stage.currentSearchResultIndex);
    }
  }, [Stage.currentSearchResultIndex]);

  const [searchResultCount, setSearchResultCount] = React.useState(0);
  useEffect(() => {
    setSearchResultCount(Stage.searchResultNodes.length);
  }, [Stage.searchResultNodes]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasElement) {
        Renderer.resizeWindow(window.innerWidth, window.innerHeight);
      }
    };
    const handleFocus = () => {
      focus = true;
    };
    const handleBlur = () => {
      focus = false;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      // event.preventDefault();
      if (Controller.pressingKeySet.has("control") && event.key === "f") {
        Controller.pressingKeySet.clear();
        // setIsSearching(true);
        const searchString = prompt("请输入要搜索的节点名称");
        if (searchString) {
          // 开始搜索
          Stage.searchResultNodes = [];
          for (const node of StageManager.nodes) {
            if (node.text.includes(searchString)) {
              Stage.searchResultNodes.push(node);
            }
          }
          Stage.currentSearchResultIndex = 0;
          if (Stage.searchResultNodes.length > 0) {
            setIsSearchingShow(true);
            setCurrentSearchResultIndex(0);
            // 选择第一个搜索结果节点
            const currentNode =
              Stage.searchResultNodes[Stage.currentSearchResultIndex];
            currentNode.isSelected = true;
            // 摄像机对准现在的节点
            Camera.location = currentNode.rectangle.center.clone();
          } else {
            dialog.show({
              title: "提示",
              type: "info",
              content: "没有找到匹配的节点",
            });
          }
        }
      }
      // setSearchString(searchString + event.key)
    };

    const canvasElement = canvasRef.current;
    let focus = true;

    if (canvasElement) {
      Canvas.init(canvasElement);
      Renderer.resizeWindow(window.innerWidth, window.innerHeight);
      Controller.init();
      Controller.setCursorName = setCursorName;
    } else {
      dialog.show({
        title: "错误",
        type: "error",
        content: "canvas元素不存在",
      });
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("keydown", handleKeyDown);

    Settings.get("windowBackgroundAlpha").then((value) => {
      Renderer.backgroundAlpha = value;
    });

    // 开启定时器
    let lastTime = performance.now();
    // let i = 0;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      if (!focus) {
        return;
      }
      // 计算FPS
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      setFps(1 / deltaTime);
      Renderer.frameTick();
      Stage.logicTick();
      // i++;
    };

    let frameId = requestAnimationFrame(loop);

    // 清理事件监听器
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      Controller.destroy();
      cancelAnimationFrame(frameId);
      StageManager.destroy();
    };
  }, []);

  return (
    <>
      <Toolbar />
      {isSearchingShow && (
        <div
          className={cn(
            "fixed right-32 top-32 z-10 flex transform items-center rounded p-4 ring",
            isSearchingShow,
          )}
        >
          <span>
            {currentSearchResultIndex + 1}/{searchResultCount}
          </span>
          <button
            className="m-2 rounded-md bg-gray-500 text-white"
            onClick={() => {
              if (Stage.currentSearchResultIndex > 0) {
                Stage.currentSearchResultIndex--;
              }
              // 取消选择所有节点
              for (const node of StageManager.nodes) {
                node.isSelected = false;
              }
              // 选择当前搜索结果节点
              const currentNode =
                Stage.searchResultNodes[Stage.currentSearchResultIndex];
              currentNode.isSelected = true;
              // 摄像机对准现在的节点
              Camera.location = currentNode.rectangle.center.clone();
            }}
          >
            Previous
          </button>
          <button
            className="m-2 rounded-md bg-gray-500 text-white"
            onClick={() => {
              if (Stage.currentSearchResultIndex < searchResultCount - 1) {
                Stage.currentSearchResultIndex++;
              }
              // 取消选择所有节点
              for (const node of StageManager.nodes) {
                node.isSelected = false;
              }
              // 选择当前搜索结果节点
              const currentNode =
                Stage.searchResultNodes[Stage.currentSearchResultIndex];
              currentNode.isSelected = true;
              // 摄像机对准现在的节点
              Camera.location = currentNode.rectangle.center.clone();
            }}
          >
            Next
          </button>
          <button
            className="m-2 rounded-md bg-gray-500 text-white"
            onClick={() => {
              setIsSearchingShow(false);
            }}
          >
            关闭
          </button>
        </div>
      )}
      <span
        className="fixed bottom-0 left-0 cursor-pointer ring"
        onClick={() => {
          window.location.reload();
        }}
      >
        FPS={fps.toFixed()}
      </span>
      <canvas ref={canvasRef} className={`cursor-${cursorName}`} />
    </>
  );
  // cursor-default
  // cursor-pointer
  // cursor-grab
  // cursor-grabbing
  // cursor-move

  // cursor-${cursorName}
}
