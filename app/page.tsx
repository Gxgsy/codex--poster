"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetConfig } from "@/lib/assets/schema";

type Status = "idle" | "loading" | "success" | "error";

export default function HomePage() {
  const [assets, setAssets] = useState<AssetConfig | null>(null);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("智慧校园空间");
  const [subtitle, setSubtitle] = useState("高级温馨的学习休息场景");
  const [productId, setProductId] = useState("");
  const [viewId, setViewId] = useState("");
  const [backgroundId, setBackgroundId] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const [showSalesInfo, setShowSalesInfo] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  useEffect(() => {
    fetch("/api/assets")
      .then((response) => response.json())
      .then((config: AssetConfig) => {
        setAssets(config);
        setProductId(config.products[0]?.id ? config.products[0].id : "");
        setViewId(config.products[0]?.views[0]?.id ? config.products[0].views[0].id : "");
        setBackgroundId(config.backgrounds[0]?.id ? config.backgrounds[0].id : "");
      })
      .catch(() => setError("素材配置加载失败"));
  }, []);

  useEffect(() => {
    return () => {
      if (posterUrl) {
        URL.revokeObjectURL(posterUrl);
      }
    };
  }, [posterUrl]);

  const selectedProduct = useMemo(
    () => assets?.products.find((product) => product.id === productId),
    [assets, productId],
  );
  const canGenerate = Boolean(
    assets && productId && viewId && backgroundId && password && title && subtitle && status !== "loading",
  );

  async function generatePoster() {
    if (!canGenerate) {
      setError("请先完成必填信息并等待素材加载完成");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    setPosterUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return "";
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          title,
          subtitle,
          productId,
          viewId,
          backgroundId,
          showLogo,
          showSalesInfo,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "生成失败" }));
        setError(payload.error ? payload.error : "生成失败");
        setStatus("error");
        return;
      }

      const blob = await response.blob();
      setPosterUrl(URL.createObjectURL(blob));
      setStatus("success");
    } catch {
      setError("网络异常，请稍后重试");
      setStatus("error");
    }
  }

  return (
    <main className="page-shell">
      <section className="tool-panel">
        <div className="form-panel">
          <h1>AI 海报生成器</h1>
          <label>
            访问密码
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          <label>
            标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={40} />
          </label>
          <label>
            副标题
            <textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} maxLength={80} />
          </label>
          <label>
            主视觉产品
            <select
              value={productId}
              onChange={(event) => {
                const nextProduct = assets?.products.find((product) => product.id === event.target.value);
                setProductId(event.target.value);
                setViewId(nextProduct?.views[0]?.id ? nextProduct.views[0].id : "");
              }}
            >
              {assets?.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            产品视角
            <select value={viewId} onChange={(event) => setViewId(event.target.value)}>
              {selectedProduct?.views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            背景场景
            <select value={backgroundId} onChange={(event) => setBackgroundId(event.target.value)}>
              {assets?.backgrounds.map((background) => (
                <option key={background.id} value={background.id}>
                  {background.name}
                </option>
              ))}
            </select>
          </label>
          <div className="switch-row">
            <label>
              <input type="checkbox" checked={showLogo} onChange={(event) => setShowLogo(event.target.checked)} /> 显示
              logo
            </label>
            <label>
              <input
                type="checkbox"
                checked={showSalesInfo}
                onChange={(event) => setShowSalesInfo(event.target.checked)}
              />{" "}
              显示销售栏
            </label>
          </div>
          <button disabled={!canGenerate} onClick={generatePoster}>
            {status === "loading" ? "生成中..." : "生成海报"}
          </button>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="preview-panel">
          {posterUrl ? (
            <>
              <img src={posterUrl} alt="生成的海报" />
              <a className="download" href={posterUrl} download="poster.png">
                下载 PNG
              </a>
            </>
          ) : (
            <div className="empty-preview">1394 x 2700 海报预览</div>
          )}
        </div>
      </section>
    </main>
  );
}
