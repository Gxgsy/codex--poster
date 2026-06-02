"use client";

import { useEffect, useMemo, useState } from "react";
import initialAssetConfig from "@/data/assets.config.json";
import type { AssetConfig } from "@/lib/assets/schema";

type Status = "idle" | "loading" | "success" | "error";

const initialAssets = initialAssetConfig as AssetConfig;
const initialProduct = initialAssets.products[0];
const initialView = initialProduct?.views[0];
const initialBackground = initialAssets.backgrounds[0];
const initialLogo = initialAssets.logos[0];
const quickPosterSizes = ["1080*1920", "1080*1440"];

export default function HomePage() {
  const [assets, setAssets] = useState<AssetConfig>(initialAssets);
  const [doubaoApiKey, setDoubaoApiKey] = useState("");
  const [showDoubaoApiKey, setShowDoubaoApiKey] = useState(false);
  const [posterSize, setPosterSize] = useState("1080*1920");
  const [title, setTitle] = useState("不止放松，更能治愈");
  const [subtitle, setSubtitle] = useState("校园心育新基建，AI 减压舱一舱到位");
  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [viewId, setViewId] = useState(initialView?.id ?? "");
  const [backgroundId, setBackgroundId] = useState(initialBackground?.id ?? "");
  const [logoId, setLogoId] = useState(initialLogo?.id ?? "");
  const [showLogo, setShowLogo] = useState(true);
  const [showSalesInfo, setShowSalesInfo] = useState(true);
  const [salesName, setSalesName] = useState("");
  const [salesPhone, setSalesPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [assetMessage, setAssetMessage] = useState("");
  const [posterUrls, setPosterUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/assets")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Asset config request failed");
        }

        return response.json();
      })
      .then((config: AssetConfig) => {
        setAssets(config);
        setProductId((current) => current || config.products[0]?.id || "");
        setViewId((current) => current || config.products[0]?.views[0]?.id || "");
        setBackgroundId((current) => current || config.backgrounds[0]?.id || "");
        setLogoId((current) => current || config.logos[0]?.id || "");
      })
      .catch(() => {
        setAssets(initialAssets);
      });
  }, []);

  const selectedProduct = useMemo(
    () => assets?.products.find((product) => product.id === productId),
    [assets, productId],
  );
  const selectedBackground = useMemo(
    () => assets?.backgrounds.find((background) => background.id === backgroundId),
    [assets, backgroundId],
  );
  const selectedView = useMemo(
    () => selectedProduct?.views.find((view) => view.id === viewId),
    [selectedProduct, viewId],
  );
  const posterSizeParts = posterSize.match(/^(\d{3,5})\*(\d{3,5})$/);
  const previewAspectRatio = posterSizeParts ? `${posterSizeParts[1]} / ${posterSizeParts[2]}` : "1080 / 1920";
  const canGenerate = Boolean(
    assets && doubaoApiKey && productId && viewId && backgroundId && selectedView?.image && posterSize && (!showLogo || logoId) && title && subtitle && status !== "loading",
  );

  async function refreshAssets(config?: AssetConfig) {
    if (config) {
      setAssets(config);
      return;
    }

    const response = await fetch("/api/assets");
    if (!response.ok) {
      throw new Error("素材配置刷新失败");
    }

    setAssets(await response.json() as AssetConfig);
  }

  async function uploadAsset(kind: "background" | "product-view", file: File | undefined) {
    if (!file) {
      return;
    }

    setAssetMessage("素材上传中...");
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    if (kind === "background") {
      formData.append("backgroundId", backgroundId);
    } else {
      formData.append("productId", productId);
      formData.append("viewId", viewId);
    }

    const response = await fetch("/api/assets/upload", { method: "POST", body: formData });
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      setAssetMessage(payload?.error || "素材上传失败");
      return;
    }

    await refreshAssets(payload as AssetConfig);
    setAssetMessage("素材已更新");
  }

  async function deleteAsset(kind: "background" | "product-view") {
    setAssetMessage("素材删除中...");
    const response = await fetch("/api/assets/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "background"
        ? { kind, backgroundId }
        : { kind, productId, viewId })
    });
    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      setAssetMessage(payload?.error || "素材删除失败");
      return;
    }

    await refreshAssets(payload as AssetConfig);
    setAssetMessage("素材已删除");
  }

  async function generatePoster() {
    if (!canGenerate) {
      setError("请先完成必填信息并等待素材加载完成");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    setPosterUrls([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doubaoApiKey,
          title,
          subtitle,
          posterSize,
          productId,
          viewId,
          backgroundId,
          logoId,
          showLogo,
          showSalesInfo,
          salesName,
          salesPhone,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "生成失败" }));
        setError(payload.error ? payload.error : "生成失败");
        setStatus("error");
        return;
      }

      const payload = await response.json() as { posters?: Array<{ image: string }> };
      setPosterUrls(payload.posters?.map((poster) => poster.image) ?? []);
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
            豆包 API Key
            <span className="secret-input">
              <input
                value={doubaoApiKey}
                onChange={(event) => setDoubaoApiKey(event.target.value.trim())}
                type={showDoubaoApiKey ? "text" : "password"}
                placeholder="每个用户请输入自己的豆包 key"
                autoComplete="off"
              />
              <button
                type="button"
                className="secret-toggle"
                aria-label={showDoubaoApiKey ? "隐藏豆包 API Key" : "显示豆包 API Key"}
                title={showDoubaoApiKey ? "隐藏" : "显示"}
                onClick={() => setShowDoubaoApiKey((current) => !current)}
              >
                {showDoubaoApiKey ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.5 5.2A9.7 9.7 0 0 1 12 5c5 0 8.3 4.1 9.5 7a13.2 13.2 0 0 1-2.2 3.3" />
                    <path d="M6.2 6.8A13.5 13.5 0 0 0 2.5 12C3.7 14.9 7 19 12 19a9.8 9.8 0 0 0 4.1-.9" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M2.5 12C3.7 9.1 7 5 12 5s8.3 4.1 9.5 7c-1.2 2.9-4.5 7-9.5 7s-8.3-4.1-9.5-7Z" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                )}
              </button>
            </span>
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
            标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={14} />
          </label>
          <label>
            副标题
            <textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} maxLength={20} />
          </label>
          <div className="field-group">
            <span>生成尺寸</span>
            <input
              value={posterSize}
              onChange={(event) => setPosterSize(event.target.value.replace(/[xX＊×]/g, "*"))}
              placeholder="例如 1080*1920"
            />
            <div className="quick-size-row">
              {quickPosterSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={posterSize === size ? "selected" : ""}
                  onClick={() => setPosterSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
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
          <div className="asset-panel">
            <div className="asset-panel-header">
              <span>背景参考图</span>
              <span>{selectedBackground?.image ? "生成时会传给豆包" : "未上传，仅按提示词生成"}</span>
            </div>
            <p className="asset-path">{selectedBackground?.image || "无背景参考图"}</p>
            {selectedBackground?.image ? <img className="asset-preview" src={selectedBackground.image} alt="背景参考图" /> : null}
            <div className="asset-actions">
              <label className="file-button">
                上传/替换
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    void uploadAsset("background", event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button type="button" className="secondary-button" disabled={!selectedBackground?.image} onClick={() => void deleteAsset("background")}>
                删除
              </button>
            </div>
          </div>
          <div className="asset-panel">
            <div className="asset-panel-header">
              <span>产品视角与三视图参考图</span>
              <span>{selectedView?.image ? "当前视角已上传" : "当前视角未上传"}</span>
            </div>
            <div className="asset-list">
              {selectedProduct?.views.map((view) => (
                <button
                  type="button"
                  className={view.id === viewId ? "asset-row selected" : "asset-row"}
                  key={view.id}
                  onClick={() => setViewId(view.id)}
                >
                  <span>{view.name}</span>
                  <code>{view.image || "未上传"}</code>
                </button>
              ))}
            </div>
            {selectedView?.image ? <img className="asset-preview" src={selectedView.image} alt={`${selectedView.name}参考图`} /> : null}
            <div className="asset-actions">
              <label className="file-button">
                上传/替换当前视角
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    void uploadAsset("product-view", event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button type="button" className="secondary-button" disabled={!selectedView?.image} onClick={() => void deleteAsset("product-view")}>
                删除当前视角
              </button>
            </div>
          </div>
          {assetMessage ? <p className="asset-message">{assetMessage}</p> : null}
          <div className="switch-row">
            <label>
              <input type="checkbox" checked={showLogo} onChange={(event) => setShowLogo(event.target.checked)} /> 显示
              logo
            </label>
          </div>
          {showLogo ? (
            <div className="field-group">
              <span>选择 logo</span>
              <div className="logo-grid">
                {assets?.logos.map((logo) => (
                  <label
                    key={logo.id}
                    className={[
                      "logo-option",
                      `logo-option-${logo.id}`,
                      logoId === logo.id ? "selected" : ""
                    ].filter(Boolean).join(" ")}
                  >
                    <input
                      type="radio"
                      name="logoId"
                      value={logo.id}
                      checked={logoId === logo.id}
                      onChange={() => setLogoId(logo.id)}
                    />
                    <img src={logo.image} alt={logo.name} />
                    <span>{logo.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="switch-row">
            <label>
              <input
                type="checkbox"
                checked={showSalesInfo}
                onChange={(event) => setShowSalesInfo(event.target.checked)}
              />{" "}
              显示销售栏
            </label>
          </div>
          {showSalesInfo ? (
            <div className="sales-fields">
              <label>
                姓名
                <input
                  value={salesName}
                  onChange={(event) => setSalesName(event.target.value.slice(0, 5))}
                  maxLength={5}
                  placeholder="最多 5 个字符"
                />
              </label>
              <label>
                电话
                <input
                  value={salesPhone}
                  onChange={(event) => setSalesPhone(event.target.value.slice(0, 12))}
                  maxLength={12}
                  inputMode="tel"
                  placeholder="最多 12 个字符"
                />
              </label>
            </div>
          ) : null}
          <button className="generate-button" disabled={!canGenerate} onClick={generatePoster}>
            {status === "loading" ? "生成中..." : "生成海报"}
          </button>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="preview-panel">
          {posterUrls.length > 0 ? (
            <div className="poster-grid">
              {posterUrls.map((posterUrl, index) => (
                <figure className="poster-card" key={posterUrl.slice(0, 80) + index}>
                  <img src={posterUrl} alt={`生成的海报 ${index + 1}`} style={{ aspectRatio: previewAspectRatio }} />
                  <figcaption>
                    <span>方案 {index + 1}</span>
                    <a className="download" href={posterUrl} download={`poster-${index + 1}.png`}>
                      下载 PNG
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="empty-preview" style={{ aspectRatio: previewAspectRatio }}>生成后展示 3 张 {posterSize} 海报候选</div>
          )}
        </div>
      </section>
    </main>
  );
}
